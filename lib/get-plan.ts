import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, type Plan } from "@/lib/plan";

/** Server-side: resolve the current session user's plan. Defaults to free. */
export async function getCurrentPlan(): Promise<{
  userId: string | null;
  plan: Plan;
  pro: boolean;
}> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (!userId) return { userId: null, plan: "free", pro: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const pro = isPro(user);
  return { userId, plan: pro ? "pro" : "free", pro };
}
