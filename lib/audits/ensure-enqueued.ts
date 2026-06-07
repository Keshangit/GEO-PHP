import { createAdminClient } from "@/lib/supabase/admin";
import { startFullAudit } from "@/lib/geo-ops/client";
import type { AuditRecord } from "@/lib/types/audit";

function enqueueErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Failed to start full audit";
  if (/redis/i.test(raw)) {
    return "The report queue is temporarily offline. Please try again in a few minutes.";
  }
  return raw;
}

export async function ensureFullAuditEnqueued(
  audit: AuditRecord
): Promise<AuditRecord> {
  if (
    audit.tier !== "paid" ||
    audit.ops_job_id ||
    audit.status === "completed" ||
    audit.status === "failed"
  ) {
    return audit;
  }

  const admin = createAdminClient();

  try {
    const job = await startFullAudit(audit.url, audit.domain, audit.id);
    const { data: updated, error } = await admin
      .from("audits")
      .update({
        ops_job_id: job.job_id,
        status: "queued",
        error_message: null,
      })
      .eq("id", audit.id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new Error(error?.message ?? "Failed to save job id");
    }

    return updated as AuditRecord;
  } catch (e) {
    console.error("Failed to enqueue full audit:", e);
    const message = enqueueErrorMessage(e);

    const { data: updated } = await admin
      .from("audits")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", audit.id)
      .select("*")
      .single();

    return (updated ?? {
      ...audit,
      status: "failed",
      error_message: message,
    }) as AuditRecord;
  }
}

export async function retryFullAuditEnqueue(
  audit: AuditRecord
): Promise<AuditRecord> {
  if (audit.tier !== "paid" || audit.status === "completed") {
    return audit;
  }

  const admin = createAdminClient();
  const { data: reset, error } = await admin
    .from("audits")
    .update({
      status: "queued",
      error_message: null,
      ops_job_id: null,
    })
    .eq("id", audit.id)
    .select("*")
    .single();

  if (error || !reset) {
    throw new Error(error?.message ?? "Failed to reset audit");
  }

  return ensureFullAuditEnqueued(reset as AuditRecord);
}
