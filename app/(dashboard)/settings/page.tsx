import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { id: true, name: true, email: true },
  });

  return <SettingsClient user={user!} />;
}
