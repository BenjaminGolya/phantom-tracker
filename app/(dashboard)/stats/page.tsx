import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsClient } from "@/components/stats/stats-client";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  const habits = await prisma.habit.findMany({
    where: { userId: session!.user!.id, archived: false },
    include: { logs: true },
    orderBy: { createdAt: "asc" },
  });

  return <StatsClient habits={habits} />;
}
