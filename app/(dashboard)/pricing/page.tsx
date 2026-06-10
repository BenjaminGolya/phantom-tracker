import { Suspense } from "react";
import { getCurrentPlan } from "@/lib/get-plan";
import { prisma } from "@/lib/prisma";
import { PricingClient } from "@/components/pricing/pricing-client";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { pro, userId } = await getCurrentPlan();

  // Trial is offered only to users who have never subscribed before.
  // hasBilling = there's a Stripe customer to manage/cancel (paid, not comp).
  let trialEligible = false;
  let hasBilling = false;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { proSince: true, stripeCustomerId: true },
    });
    trialEligible = !pro && !u?.proSince;
    hasBilling = !!u?.stripeCustomerId;
  }

  return (
    <Suspense fallback={null}>
      <PricingClient pro={pro} trialEligible={trialEligible} hasBilling={hasBilling} />
    </Suspense>
  );
}
