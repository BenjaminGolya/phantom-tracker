import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopBar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { getProfileLevel } from "@/lib/utils";
import { isPro, partitionHabits } from "@/lib/plan";
import { getActiveHabitsWithLogs } from "@/lib/habits";
import { isLocale } from "@/lib/i18n/config";
import { LangSync } from "@/components/i18n/lang-sync";
import { HabitLockGate } from "@/components/habits/habit-lock-gate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [habits, dbUser] = await Promise.all([
    getActiveHabitsWithLogs(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, plan: true, disabledAt: true, deletionRequestedAt: true, language: true },
    }),
  ]);

  // Disabled or pending-deletion accounts can't use the app until reactivated.
  if (dbUser?.disabledAt || dbUser?.deletionRequestedAt) {
    redirect("/account/reactivate");
  }

  const pro = isPro(dbUser);

  const user = {
    name: dbUser?.name ?? session.user.name ?? null,
    email: dbUser?.email ?? session.user.email ?? null,
    image: dbUser?.image ?? null,
  };

  const { active: activeHabits } = partitionHabits(habits, pro);
  const profileLevel = getProfileLevel(
    activeHabits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro }
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isLocale(dbUser?.language) && <LangSync dbLang={dbUser.language} />}
      <HabitLockGate
        pro={pro}
        habits={habits.map((h) => ({
          id: h.id, name: h.name, icon: h.icon, color: h.color,
          category: h.category, archived: h.archived, locked: h.locked,
        }))}
      />
      <Sidebar
        user={user}
        pro={pro}
        profileLevel={{
          level: profileLevel.level,
          label: profileLevel.label,
          emoji: profileLevel.emoji,
          color: profileLevel.color,
          progress: profileLevel.progress,
          xp: profileLevel.xp,
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
