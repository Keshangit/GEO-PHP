import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getStripeAmountCents(): number {
  return parseInt(process.env.STRIPE_PRICE_AMOUNT ?? "900", 10);
}

export function getStripeCurrency(): string {
  return process.env.STRIPE_CURRENCY ?? "eur";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
