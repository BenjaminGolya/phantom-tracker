import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StatsClient } from "@/components/stats/stats-client";
import { getCurrentPlan } from "@/lib/get-plan";
import { getActiveHabitsWithLogs } from "@/lib/habits";
import { partitionHabits } from "@/lib/plan";
import { hashSeed } from "@/lib/profile-traits";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro, diamond, worldSeed }] = await Promise.all([
    getActiveHabitsWithLogs(session!.user!.id),
    getCurrentPlan(),
  ]);

  const { active } = partitionHabits(habits, pro);
  return <StatsClient habits={active} pro={pro} diamond={diamond} seed={worldSeed ?? hashSeed(session!.user!.id)} />;
}
