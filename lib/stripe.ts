import "server-only";
import Stripe from "stripe";

// Stripe is optional at build time — keys are injected via env. We lazily
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

/** The recurring price for the Pro plan ($2/mo). Created in the Stripe dashboard. */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
