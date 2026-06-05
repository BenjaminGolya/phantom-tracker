import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured, PRO_PRICE_ID } from "@/lib/stripe";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripeConfigured() || !PRO_PRICE_ID) {
    return NextResponse.json(
      { error: "billing_unavailable", message: "Billing is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, plan: true, stripeCustomerId: true },
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

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl()}/settings?upgraded=1`,
      cancel_url: `${baseUrl()}/pricing?canceled=1`,
      allow_promotion_codes: true,
      // So the webhook can map the subscription back to our user.
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    logError("stripe/checkout", err, { alert: true });
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
