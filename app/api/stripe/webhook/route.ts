import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logError } from "@/lib/log";

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe gives trial_end as a unix timestamp (seconds) or null.
function trialEndDate(trialEnd?: number | null): Date | null {
  return trialEnd ? new Date(trialEnd * 1000) : null;
}

async function setPlanByCustomer(
  customerId: string,
  plan: "free" | "pro",
  subscriptionId?: string | null,
  trialEndsAt?: Date | null
) {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  // Lifetime buyers keep Pro forever regardless of subscription changes.
  if (plan === "free" && user.lifetime) return;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId ?? (plan === "free" ? null : user.stripeSubscriptionId),
      proSince: plan === "pro" ? (user.proSince ?? new Date()) : user.proSince,
      // Clear the trial countdown once they're no longer trialing (or downgraded).
      trialEndsAt: plan === "free" ? null : trialEndsAt ?? null,
    },
  });
  // Going Pro restores full access: unlock every previously locked habit, and
  // arm the trial-ending reminder for any (new) trial.
  if (plan === "pro") {
    await prisma.habit.updateMany({ where: { userId: user.id, locked: true }, data: { locked: false } });
    await prisma.user.update({ where: { id: user.id }, data: { trialReminderSent: false } });
  }
}

async function setPlanByUserId(
  userId: string,
  plan: "free" | "pro",
  customerId?: string,
  subscriptionId?: string | null,
  trialEndsAt?: Date | null
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      stripeSubscriptionId: subscriptionId ?? undefined,
      ...(plan === "pro" ? { proSince: new Date() } : {}),
      trialEndsAt: plan === "free" ? null : trialEndsAt ?? null,
    },
  });
  if (plan === "pro") {
    await prisma.habit.updateMany({ where: { userId, locked: true }, data: { locked: false } });
    await prisma.user.update({ where: { id: userId }, data: { trialReminderSent: false } });
  }
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

        // One-time Lifetime purchase → permanent Pro, no subscription.
        if (s.metadata?.lifetime === "1" || s.mode === "payment") {
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { lifetime: true, plan: "pro", proSince: new Date(), ...(customerId ? { stripeCustomerId: customerId } : {}) },
            });
            await prisma.habit.updateMany({ where: { userId, locked: true }, data: { locked: false } });
          } else if (customerId) {
            const u = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
            if (u) {
              await prisma.user.update({ where: { id: u.id }, data: { lifetime: true, plan: "pro", proSince: u.proSince ?? new Date() } });
              await prisma.habit.updateMany({ where: { userId: u.id, locked: true }, data: { locked: false } });
            }
          }
          break;
        }

        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
        // Pull the subscription to learn whether it's on a trial and when it ends.
        let trialEndsAt: Date | null = null;
        if (subId) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subId);
            trialEndsAt = sub.status === "trialing" ? trialEndDate(sub.trial_end) : null;
          } catch { /* non-fatal: countdown just won't show */ }
        }
        if (userId) await setPlanByUserId(userId, "pro", customerId, subId, trialEndsAt);
        else if (customerId) await setPlanByCustomer(customerId, "pro", subId, trialEndsAt);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const active = sub.status === "active" || sub.status === "trialing";
        const trialEndsAt = sub.status === "trialing" ? trialEndDate(sub.trial_end) : null;
        await setPlanByCustomer(customerId, active ? "pro" : "free", active ? sub.id : null, trialEndsAt);
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
