import { Suspense } from "react";
import { getCurrentPlan } from "@/lib/get-plan";
import { PricingClient } from "@/components/pricing/pricing-client";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { pro } = await getCurrentPlan();
  return (
    <Suspense fallback={null}>
      <PricingClient pro={pro} />
    </Suspense>
  );
}
