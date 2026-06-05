import { Suspense } from "react";
import { getCurrentPlan } from "@/lib/get-plan";
import { prisma } from "@/lib/prisma";
import { PricingClient } from "@/components/pricing/pricing-client";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { pro, userId } = await getCurrentPlan();

  // Trial is offered only to users who have never subscribed before.
  let trialEligible = false;
  if (userId && !pro) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { proSince: true } });
    trialEligible = !u?.proSince;
  }

  return (
    <Suspense fallback={null}>
      <PricingClient pro={pro} trialEligible={trialEligible} />
    </Suspense>
  );
}
