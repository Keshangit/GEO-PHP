import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { confirmAuditPayment } from "@/lib/audits/fulfill-payment";
import { ensureFullAuditEnqueued } from "@/lib/audits/ensure-enqueued";
import { syncAuditFromOpsJob } from "@/lib/audits/sync-job";
import type { AuditRecord } from "@/lib/types/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const { data: audit, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  let record = audit as AuditRecord;

  if (record.stripe_session_id && !record.paid_at) {
    try {
      record = await confirmAuditPayment(record, user!.id, sessionId);
    } catch (e) {
      console.error("Payment confirm failed:", e);
    }
  }

  const needsEnqueue =
    record.tier === "paid" &&
    !record.ops_job_id &&
    !record.full_report &&
    record.status !== "failed";

  if (needsEnqueue) {
    try {
      record = await ensureFullAuditEnqueued(record, supabase);
    } catch (e) {
      console.error("Enqueue ensure failed:", e);
    }
  }

  if (
    record.tier === "paid" &&
    record.ops_job_id &&
    !["completed", "failed"].includes(record.status)
  ) {
    try {
      record = await syncAuditFromOpsJob(record, supabase);
    } catch (e) {
      console.error("Job sync failed:", e);
    }
  }

  const { data: unlocked } = await supabase
    .from("unlocked_domains")
    .select("id")
    .eq("user_id", user!.id)
    .eq("domain", record.domain)
    .maybeSingle();

  return NextResponse.json({
    ...record,
    unlocked: Boolean(unlocked),
  });
}
