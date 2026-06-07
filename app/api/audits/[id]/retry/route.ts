import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { retryFullAuditEnqueue } from "@/lib/audits/ensure-enqueued";
import { syncAuditFromOpsJob } from "@/lib/audits/sync-job";
import type { AuditRecord } from "@/lib/types/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  if (audit.tier !== "paid") {
    return NextResponse.json(
      { error: "Unlock this domain before retrying the full report." },
      { status: 400 }
    );
  }

  if (audit.status === "completed") {
    return NextResponse.json({ error: "Report is already complete." }, { status: 400 });
  }

  let record: AuditRecord;
  try {
    record = await retryFullAuditEnqueue(audit as AuditRecord);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Retry failed" },
      { status: 500 }
    );
  }

  if (
    record.ops_job_id &&
    !["completed", "failed"].includes(record.status)
  ) {
    try {
      record = await syncAuditFromOpsJob(record);
    } catch (e) {
      console.error("Job sync failed after retry:", e);
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
