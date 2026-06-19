import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { fulfillPaidAudit } from "@/lib/audits/fulfill-payment";
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
      await fulfillPaidAudit(session);
    }
  }

  return NextResponse.json({ received: true });
}
