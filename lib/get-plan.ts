import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, type Plan } from "@/lib/plan";

/**
 * Server-side: resolve the current session user's plan. Defaults to free.
 * Wrapped in React cache() so multiple callers in the same request (layout +
 * page) share a single DB round-trip instead of querying repeatedly.
 */
export const getCurrentPlan = cache(async (): Promise<{
  userId: string | null;
  plan: Plan;
  pro: boolean;
  diamond: boolean;
}> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (!userId) return { userId: null, plan: "free", pro: false, diamond: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, lifetime: true, proUntil: true },
  });
  const pro = isPro(user);
  // Diamond = the permanent (lifetime) tier.
  const diamond = !!user?.lifetime;
  return { userId, plan: pro ? "pro" : "free", pro, diamond };
});
