import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getCurrentPlan } from "@/lib/get-plan";
import { getActiveHabitsWithLogs } from "@/lib/habits";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const [habits, { pro }] = await Promise.all([
    getActiveHabitsWithLogs(session!.user!.id),
    getCurrentPlan(),
  ]);

  return <DashboardClient habits={habits} pro={pro} />;
}
