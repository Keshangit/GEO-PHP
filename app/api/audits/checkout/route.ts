import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { normalizeDomain, toFetchUrl } from "@/lib/domain";
import {
  getAppUrl,
  getStripe,
  getStripeAmountCents,
  getStripeCurrency,
} from "@/lib/stripe";

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  let body: { audit_id?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let audit = null;

  if (body.audit_id) {
    const { data } = await supabase
      .from("audits")
      .select("*")
      .eq("id", body.audit_id)
      .eq("user_id", user!.id)
      .maybeSingle();
    audit = data;
  }

  if (!audit && body.url) {
    let domain: string;
    try {
      domain = normalizeDomain(body.url);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid URL" },
        { status: 422 }
      );
    }

    const { data, error } = await supabase
      .from("audits")
      .insert({
        user_id: user!.id,
        url: toFetchUrl(domain),
        domain,
        tier: "free",
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create audit." },
        { status: 500 }
      );
    }
    audit = data;
  }

  if (!audit) {
    return NextResponse.json(
      { error: "Valid audit_id or url required." },
      { status: 422 }
    );
  }

  const { data: existingUnlock } = await supabase
    .from("unlocked_domains")
    .select("id")
    .eq("user_id", user!.id)
    .eq("domain", audit.domain)
    .maybeSingle();

  if (existingUnlock) {
    return NextResponse.json(
      { error: "Domain already unlocked." },
      { status: 409 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments not configured." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/audits/${audit.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/audits/${audit.id}`,
    client_reference_id: audit.id,
    metadata: {
      user_id: user!.id,
      audit_id: audit.id,
      normalized_domain: audit.domain,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: getStripeCurrency(),
          unit_amount: getStripeAmountCents(),
          product_data: {
            name: `Full GEO Report — ${audit.domain}`,
          },
        },
      },
    ],
  });

  await supabase
    .from("audits")
    .update({ stripe_session_id: session.id, tier: "paid" })
    .eq("id", audit.id);

  return NextResponse.json({ checkout_url: session.url });
}
