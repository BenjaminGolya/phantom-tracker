import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountReactivatedEmail } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

// Clears both the disabled and pending-deletion flags, restoring full access.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { disabledAt: null, deletionRequestedAt: null },
      select: { email: true, name: true },
    });
    try { await sendAccountReactivatedEmail(user.email, user.name); }
    catch (e) { logError("account/reactivate:email", e); }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("account/reactivate", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
