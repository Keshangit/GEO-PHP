import { createAdminClient } from "@/lib/supabase/admin";
import { getJob } from "@/lib/geo-ops/client";
import type { AuditRecord, AuditStatus, JobStatus } from "@/lib/types/audit";
import { deliverCompletedReport } from "@/lib/reports/deliver";

const OPS_TO_AUDIT_STATUS: Record<JobStatus, AuditStatus> = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

export async function syncAuditFromOpsJob(
  audit: AuditRecord
): Promise<AuditRecord> {
  if (
    audit.tier !== "paid" ||
    !audit.ops_job_id ||
    audit.status === "completed" ||
    audit.status === "failed"
  ) {
    return audit;
  }

  const job = await getJob(audit.ops_job_id);
  const status = OPS_TO_AUDIT_STATUS[job.status];

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    status,
    duration_ms: job.duration_ms,
    error_message: job.error ?? null,
  };

  if (job.status === "completed" && job.report) {
    updates.full_report = job.report;
    updates.completed_at = job.completed_at ?? new Date().toISOString();
  }

  const { data: updated, error } = await admin
    .from("audits")
    .update(updates)
    .eq("id", audit.id)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to sync audit");
  }

  const synced = updated as AuditRecord;

  if (
    synced.status === "completed" &&
    synced.full_report &&
    !synced.pdf_path
  ) {
    await deliverCompletedReport(synced);
    const { data: redelivered } = await admin
      .from("audits")
      .select("*")
      .eq("id", audit.id)
      .single();
    if (redelivered) {
      return redelivered as AuditRecord;
    }
  }

  return synced;
}
