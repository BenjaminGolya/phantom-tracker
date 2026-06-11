import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calcStreak } from "@/lib/utils";
import { isPro } from "@/lib/plan";
import { AdminClient } from "@/components/admin/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      lifetime: true,
      proUntil: true,
      disabledAt: true,
      deletionRequestedAt: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { habits: true } },
      habits: {
        select: { logs: { select: { date: true, completed: true, frozen: true } } },
      },
    },
  });

  const rows = users.map((u) => {
    // A few headline stats per user.
    let checkins = 0;
    let bestStreak = 0;
    let lastActive: string | null = null;
    for (const h of u.habits) {
      const streak = calcStreak(h.logs).current;
      if (streak > bestStreak) bestStreak = streak;
      for (const l of h.logs) {
        if (l.completed) {
          checkins++;
          if (!lastActive || l.date > lastActive) lastActive = l.date;
        }
      }
    }
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      pro: isPro(u),
      lifetime: u.lifetime,
      proUntil: u.proUntil ? u.proUntil.toISOString() : null,
      disabled: !!u.disabledAt,
      pendingDeletion: !!u.deletionRequestedAt,
      verified: !!u.emailVerified,
      habitCount: u._count.habits,
      checkins,
      bestStreak,
      lastActive,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return <AdminClient users={rows} selfId={session.user.id} />;
}
