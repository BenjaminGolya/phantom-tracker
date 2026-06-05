import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, plan: true, proSince: true, trialEndsAt: true },
  });

  // Stale session (the user no longer exists in the database) → force re-login.
  if (!user) redirect("/login");

  const pro = user.plan === "pro";

  return (
    <SettingsClient
      user={{ id: user.id, name: user.name, email: user.email, image: user.image }}
      pro={pro}
      proSince={user.proSince ? user.proSince.toISOString() : null}
      trialEndsAt={user.trialEndsAt ? user.trialEndsAt.toISOString() : null}
    />
  );
}
