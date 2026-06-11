import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StatsClient } from "@/components/stats/stats-client";
import { getCurrentPlan } from "@/lib/get-plan";
import { getActiveHabitsWithLogs } from "@/lib/habits";
import { partitionHabits } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro, diamond }] = await Promise.all([
    getActiveHabitsWithLogs(session!.user!.id),
    getCurrentPlan(),
  ]);

  const { active } = partitionHabits(habits, pro);
  return <StatsClient habits={active} pro={pro} diamond={diamond} />;
}
