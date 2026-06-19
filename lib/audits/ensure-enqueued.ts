import type { SupabaseClient } from "@supabase/supabase-js";
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

async function updateAuditRow(
  client: SupabaseClient,
  auditId: string,
  updates: Record<string, unknown>
): Promise<AuditRecord> {
  const { data, error } = await client
    .from("audits")
    .update(updates)
    .eq("id", auditId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update audit");
  }

  return data as AuditRecord;
}

export async function ensureFullAuditEnqueued(
  audit: AuditRecord,
  client: SupabaseClient
): Promise<AuditRecord> {
  const needsEnqueue =
    audit.tier === "paid" &&
    !audit.ops_job_id &&
    !audit.full_report &&
    audit.status !== "failed";

  if (!needsEnqueue) {
    return audit;
  }

  try {
    const job = await startFullAudit(audit.url, audit.domain, audit.id);
    return updateAuditRow(client, audit.id, {
      ops_job_id: job.job_id,
      status: "queued",
      error_message: null,
    });
  } catch (e) {
    console.error("Failed to enqueue full audit:", e);
    const message = enqueueErrorMessage(e);

    try {
      return await updateAuditRow(client, audit.id, {
        status: "failed",
        error_message: message,
      });
    } catch (updateError) {
      console.error("Failed to persist enqueue error:", updateError);
      return {
        ...audit,
        status: "failed",
        error_message: message,
      };
    }
  }
}

export async function retryFullAuditEnqueue(
  audit: AuditRecord,
  client: SupabaseClient
): Promise<AuditRecord> {
  if (audit.tier !== "paid") {
    return audit;
  }

  if (audit.full_report && audit.status === "completed") {
    return audit;
  }

  const reset = await updateAuditRow(client, audit.id, {
    status: "queued",
    error_message: null,
    ops_job_id: null,
  });

  return ensureFullAuditEnqueued(reset, client);
}

/** Server-side paths without a user session (e.g. Stripe webhooks). */
export function createServiceClient(): SupabaseClient {
  return createAdminClient();
}
