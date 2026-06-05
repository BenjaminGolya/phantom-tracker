import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopBar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { getProfileLevel } from "@/lib/utils";
import { isPro } from "@/lib/plan";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [habits, dbUser] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session.user.id, archived: false },
      include: { logs: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, plan: true },
    }),
  ]);

  const pro = isPro(dbUser);

  const user = {
    name: dbUser?.name ?? session.user.name ?? null,
    email: dbUser?.email ?? session.user.email ?? null,
    image: dbUser?.image ?? null,
  };

  const profileLevel = getProfileLevel(
    habits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro }
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
