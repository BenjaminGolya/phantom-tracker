import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HabitsClient } from "@/components/habits/habits-client";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const session = await getServerSession(authOptions);
  const habits = await prisma.habit.findMany({
    where: { userId: session!.user!.id },
    include: { logs: true },
    orderBy: { createdAt: "asc" },
  });

  return <HabitsClient habits={habits} />;
}
