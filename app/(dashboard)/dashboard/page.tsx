import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getCurrentPlan } from "@/lib/get-plan";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro }] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session!.user!.id, archived: false },
      include: { logs: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentPlan(),
  ]);

  return <DashboardClient habits={habits} pro={pro} />;
}
