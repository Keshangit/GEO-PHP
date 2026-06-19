import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { startFullAudit } from "@/lib/geo-ops/client";
import { getStripe } from "@/lib/stripe";
import type { AuditRecord } from "@/lib/types/audit";

function enqueueErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Failed to start full audit";
  if (/redis/i.test(raw)) {
    return "The report queue is temporarily offline. Please try again in a few minutes.";
  }
  return raw;
}

export async function fulfillPaidAudit(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const auditId = metadata.audit_id;
  const userId = metadata.user_id;
  const domain = metadata.normalized_domain;

  if (!auditId) {
    return { ok: false as const, reason: "missing_audit_id" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false as const, reason: "not_paid" };
  }

  const admin = createAdminClient();

  let { data: audit } = await admin
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .maybeSingle();

  if (!audit && session.id) {
    const { data } = await admin
      .from("audits")
      .select("*")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    audit = data;
  }

  if (!audit) {
    return { ok: false as const, reason: "audit_not_found" };
  }

  const resolvedUserId = userId || audit.user_id;
  const resolvedDomain = domain || audit.domain;

  if (!audit.paid_at) {
    await admin
      .from("audits")
      .update({
        tier: "paid",
        status: "queued",
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
        error_message: null,
      })
      .eq("id", audit.id);

    const { data: existing } = await admin
      .from("unlocked_domains")
      .select("id")
      .eq("user_id", resolvedUserId)
      .eq("domain", resolvedDomain)
      .maybeSingle();

    if (!existing) {
      await admin.from("unlocked_domains").insert({
        user_id: resolvedUserId,
        domain: resolvedDomain,
        audit_id: audit.id,
        stripe_session_id: session.id,
      });
    }
  }

  const { data: refreshed } = await admin
    .from("audits")
    .select("*")
    .eq("id", audit.id)
    .single();

  const current = (refreshed ?? audit) as AuditRecord;

  if (current.full_report && current.status === "completed") {
    return { ok: true as const, audit: current, alreadyComplete: true };
  }

  if (current.ops_job_id && ["queued", "processing", "pending"].includes(current.status)) {
    return { ok: true as const, audit: current, alreadyQueued: true };
  }

  try {
    const job = await startFullAudit(current.url, resolvedDomain, current.id);
    const { data: updated } = await admin
      .from("audits")
      .update({
        ops_job_id: job.job_id,
        status: "queued",
        error_message: null,
      })
      .eq("id", current.id)
      .select("*")
      .single();

    return { ok: true as const, audit: (updated ?? current) as AuditRecord };
  } catch (e) {
    console.error("Failed to enqueue full audit:", e);
    const message = enqueueErrorMessage(e);
    const { data: failed } = await admin
      .from("audits")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", current.id)
      .select("*")
      .single();

    return {
      ok: false as const,
      reason: "enqueue_failed",
      audit: (failed ?? current) as AuditRecord,
      error: message,
    };
  }
}

export async function confirmAuditPayment(
  audit: AuditRecord,
  userId: string,
  sessionId?: string | null
): Promise<AuditRecord> {
  if (audit.user_id !== userId) {
    throw new Error("Forbidden");
  }

  if (audit.paid_at && audit.ops_job_id && audit.full_report) {
    return audit;
  }

  const stripeSessionId = sessionId ?? audit.stripe_session_id;
  if (!stripeSessionId) {
    return audit;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return audit;
  }

  const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);

  if (session.metadata?.audit_id && session.metadata.audit_id !== audit.id) {
    throw new Error("Payment session does not match this audit.");
  }

  const result = await fulfillPaidAudit(session);
  if (result.ok && "audit" in result && result.audit) {
    return result.audit;
  }

  if ("audit" in result && result.audit) {
    return result.audit;
  }

  return audit;
}
