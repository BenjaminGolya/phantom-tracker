import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HabitsClient } from "@/components/habits/habits-client";
import { getCurrentPlan } from "@/lib/get-plan";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro }] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session!.user!.id },
      include: { logs: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentPlan(),
  ]);

  return <HabitsClient habits={habits} pro={pro} />;
}
