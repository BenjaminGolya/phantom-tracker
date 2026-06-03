import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const habits = await prisma.habit.findMany({
    where: { userId: session!.user!.id, archived: false },
    include: { logs: true },
    orderBy: { createdAt: "asc" },
  });

  return <DashboardClient habits={habits} />;
}
