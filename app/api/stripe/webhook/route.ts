import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logError } from "@/lib/log";

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function setPlanByCustomer(customerId: string, plan: "free" | "pro", subscriptionId?: string | null) {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId ?? (plan === "free" ? null : user.stripeSubscriptionId),
      proSince: plan === "pro" ? (user.proSince ?? new Date()) : user.proSince,
    },
  });
}

async function setPlanByUserId(userId: string, plan: "free" | "pro", customerId?: string, subscriptionId?: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      stripeSubscriptionId: subscriptionId ?? undefined,
      ...(plan === "pro" ? { proSince: new Date() } : {}),
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    logError("stripe/webhook:verify", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
        if (userId) await setPlanByUserId(userId, "pro", customerId, subId);
        else if (customerId) await setPlanByCustomer(customerId, "pro", subId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const active = sub.status === "active" || sub.status === "trialing";
        await setPlanByCustomer(customerId, active ? "pro" : "free", active ? sub.id : null);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await setPlanByCustomer(customerId, "free", null);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logError(`stripe/webhook:${event.type}`, err, { alert: true });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
