import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountDeletionScheduledEmail } from "@/lib/email";
import { purgeDate, DELETION_GRACE_DAYS } from "@/lib/account";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

// Soft-delete: flag the account for deletion. A daily purge job permanently
// removes accounts whose grace period has elapsed. The user can reactivate
// (cancel) any time within the grace window.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { deletionRequestedAt: now, disabledAt: now },
      select: { email: true, name: true, language: true },
    });
    try { await sendAccountDeletionScheduledEmail(user.email, user.name, purgeDate(now), DELETION_GRACE_DAYS, user.language); }
    catch (e) { logError("account/delete:email", e); }

    return NextResponse.json({ ok: true, purgeOn: purgeDate(now).toISOString() });
  } catch (err) {
    logError("account/delete", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
