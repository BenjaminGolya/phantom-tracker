import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountDisabledEmail } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { disabledAt: new Date() },
      select: { email: true, name: true },
    });
    // Best-effort confirmation email.
    try { await sendAccountDisabledEmail(user.email, user.name); }
    catch (e) { logError("account/disable:email", e); }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("account/disable", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
