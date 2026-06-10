import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured, priceForInterval, LIFETIME_PRICE_ID, type BillingInterval } from "@/lib/stripe";
import { TRIAL_DAYS } from "@/lib/plan";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Billing interval: monthly ($2/mo) by default, yearly ($15/yr), or a one-time
  // Lifetime purchase.
  let interval: BillingInterval = "monthly";
  let lifetime = false;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.interval === "yearly") interval = "yearly";
    if (body?.interval === "lifetime") lifetime = true;
  } catch {
    /* no body → default monthly */
  }
  const priceId = lifetime ? LIFETIME_PRICE_ID : priceForInterval(interval);

  if (!stripeConfigured() || !priceId) {
    return NextResponse.json(
      { error: "billing_unavailable", message: "Billing is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, plan: true, stripeCustomerId: true, proSince: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.plan === "pro") {
      return NextResponse.json({ error: "already_pro" }, { status: 400 });
    }

    // Reuse an existing Stripe customer, or create one tied to the user id.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Offer the free trial only to users who've never subscribed before.
    const eligibleForTrial = !user.proSince;

    const checkout = await stripe.checkout.sessions.create({
      mode: lifetime ? "payment" : "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl()}/settings?upgraded=1`,
      cancel_url: `${baseUrl()}/pricing?canceled=1`,
      allow_promotion_codes: true,
      // So the webhook can map the purchase back to our user.
      ...(lifetime
        ? {}
        : {
            subscription_data: {
              metadata: { userId: user.id },
              ...(eligibleForTrial ? { trial_period_days: TRIAL_DAYS } : {}),
            },
          }),
      metadata: { userId: user.id, lifetime: lifetime ? "1" : "0" },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    logError("stripe/checkout", err, { alert: true });
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
