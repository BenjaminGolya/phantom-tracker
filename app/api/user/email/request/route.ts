import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailChangeConfirmation, sendEmailChangeNotice } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newEmail } = await req.json().catch(() => ({ newEmail: "" }));
  const email = String(newEmail ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email", message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (email === me.email.toLowerCase()) {
      return NextResponse.json({ error: "same_email", message: "That's already your email." }, { status: 400 });
    }

    // Reject if another account already uses this email.
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json({ error: "email_taken", message: "That email is already in use." }, { status: 409 });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: session.user.id },
      data: { pendingEmail: email, emailChangeToken: token, emailChangeExpires: expires },
    });

    // Confirm link to the new address; heads-up to the old one.
    try { await sendEmailChangeConfirmation(email, token, me.name); }
    catch (e) { logError("user/email/request:confirm-mail", e); }
    try { await sendEmailChangeNotice(me.email, email, me.name); }
    catch (e) { logError("user/email/request:notice-mail", e); }

    return NextResponse.json({ ok: true, pendingEmail: email });
  } catch (err) {
    logError("user/email/request", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
