import "server-only";
import Stripe from "stripe";

// Stripe is optional at build time - keys are injected via env. We lazily
// construct the client so the app still builds/runs without Stripe configured
// (the checkout route returns a friendly error instead of crashing).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  _stripe = new Stripe(key);
  return _stripe;
}

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

/** Recurring prices for the Pro plan. Created in the Stripe dashboard. */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ""; // $2 / month
export const PRO_PRICE_ID_YEARLY = process.env.STRIPE_PRO_PRICE_ID_YEARLY ?? ""; // $15 / year
export const LIFETIME_PRICE_ID = process.env.STRIPE_LIFETIME_PRICE_ID ?? ""; // €29 one-time

export type BillingInterval = "monthly" | "yearly";

/** Resolve the configured price id for a billing interval. */
export function priceForInterval(interval: BillingInterval): string {
  return interval === "yearly" ? PRO_PRICE_ID_YEARLY : PRO_PRICE_ID;
}
