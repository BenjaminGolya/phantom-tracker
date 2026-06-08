import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  const addr = String(email ?? "").trim().toLowerCase();

  // Always return ok — never reveal whether an email is registered.
  if (!EMAIL_RE.test(addr)) return NextResponse.json({ ok: true });

  try {
    const user = await prisma.user.findUnique({ where: { email: addr } });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpires: expires },
      });
      try { await sendPasswordResetEmail(user.email, token, user.name, user.language); }
      catch (e) { logError("auth/forgot:email", e); }
    }
  } catch (err) {
    logError("auth/forgot", err);
    // Still return ok to avoid leaking state.
  }

  return NextResponse.json({ ok: true });
}
