import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { daysUntilPurge, purgeDate } from "@/lib/account";
import { ReactivateClient } from "@/components/account/reactivate-client";

export const dynamic = "force-dynamic";

export default async function ReactivatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, disabledAt: true, deletionRequestedAt: true },
  });
  if (!user) redirect("/login");

  // Not actually flagged → nothing to reactivate.
  if (!user.disabledAt && !user.deletionRequestedAt) redirect("/dashboard");

  const pendingDeletion = !!user.deletionRequestedAt;
  return (
    <ReactivateClient
      name={user.name}
      email={user.email}
      pendingDeletion={pendingDeletion}
      daysLeft={pendingDeletion ? daysUntilPurge(user.deletionRequestedAt!) : null}
      purgeOn={pendingDeletion ? purgeDate(user.deletionRequestedAt!).toISOString() : null}
    />
  );
}
