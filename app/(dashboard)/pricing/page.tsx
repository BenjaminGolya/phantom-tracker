import { Suspense } from "react";
import { getCurrentPlan } from "@/lib/get-plan";
import { prisma } from "@/lib/prisma";
import { PricingClient, type CurrentPlan } from "@/components/pricing/pricing-client";
import { getStripe, stripeConfigured, PRO_PRICE_ID_YEARLY } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { pro, userId } = await getCurrentPlan();

  let trialEligible = false;
  let hasBilling = false;
  let currentPlan: CurrentPlan = "free";

  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { proSince: true, stripeCustomerId: true, stripeSubscriptionId: true, lifetime: true },
    });
    trialEligible = !pro && !u?.proSince;
    hasBilling = !!u?.stripeCustomerId;

    if (u?.lifetime) {
      currentPlan = "lifetime";
    } else if (pro) {
      currentPlan = "pro"; // generic Pro until we resolve the interval below
      if (u?.stripeSubscriptionId && stripeConfigured()) {
        try {
          const sub = await getStripe().subscriptions.retrieve(u.stripeSubscriptionId);
          const priceId = sub.items.data[0]?.price.id;
          currentPlan = priceId === PRO_PRICE_ID_YEARLY ? "yearly" : "monthly";
        } catch {
          currentPlan = "monthly";
        }
      }
    }
  }

  return (
    <Suspense fallback={null}>
      <PricingClient pro={pro} trialEligible={trialEligible} hasBilling={hasBilling} currentPlan={currentPlan} />
    </Suspense>
  );
}
