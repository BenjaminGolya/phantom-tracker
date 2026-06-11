import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
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
      disabledAt: true,
      deletionRequestedAt: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { habits: true } },
    },
  });

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    pro: u.plan === "pro" || u.lifetime,
    lifetime: u.lifetime,
    disabled: !!u.disabledAt,
    pendingDeletion: !!u.deletionRequestedAt,
    verified: !!u.emailVerified,
    habitCount: u._count.habits,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminClient users={rows} selfId={session.user.id} />;
}
