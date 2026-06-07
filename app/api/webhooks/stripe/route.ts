import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { startFullAudit } from "@/lib/geo-ops/client";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return new NextResponse("Webhook error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "payment") {
      await handlePaymentCompleted(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const auditId = metadata.audit_id;
  const userId = metadata.user_id;
  const domain = metadata.normalized_domain;

  if (!auditId) {
    return;
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

  if (!audit || audit.paid_at) {
    return;
  }

  const resolvedUserId = userId || audit.user_id;
  const resolvedDomain = domain || audit.domain;

  await admin
    .from("audits")
    .update({
      tier: "paid",
      status: "queued",
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
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

  try {
    const job = await startFullAudit(audit.url, resolvedDomain, audit.id);
    await admin
      .from("audits")
      .update({ ops_job_id: job.job_id, status: "queued" })
      .eq("id", audit.id);
  } catch (e) {
    console.error("Failed to enqueue full audit:", e);
    await admin
      .from("audits")
      .update({
        status: "failed",
        error_message:
          e instanceof Error ? e.message : "Failed to start full audit",
      })
      .eq("id", audit.id);
  }
}
