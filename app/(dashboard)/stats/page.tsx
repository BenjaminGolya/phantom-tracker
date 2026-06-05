import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsClient } from "@/components/stats/stats-client";
import { getCurrentPlan } from "@/lib/get-plan";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro }] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session!.user!.id, archived: false },
      include: { logs: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentPlan(),
  ]);

  return <StatsClient habits={habits} pro={pro} />;
}
