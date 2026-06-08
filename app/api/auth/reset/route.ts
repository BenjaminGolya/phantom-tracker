import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isStrongPassword, PASSWORD_HINT } from "@/lib/password";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  const t = String(token ?? "");
  const pw = String(password ?? "");

  if (!t) return NextResponse.json({ error: "invalid", message: "Invalid reset link." }, { status: 400 });
  if (!isStrongPassword(pw)) {
    return NextResponse.json({ error: "weak", message: PASSWORD_HINT }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { resetToken: t } });
    if (!user || !user.resetExpires) {
      return NextResponse.json({ error: "invalid", message: "This reset link is invalid or already used." }, { status: 400 });
    }
    if (user.resetExpires.getTime() < Date.now()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetExpires: null },
      });
      return NextResponse.json({ error: "expired", message: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(pw, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetExpires: null },
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    logError("auth/reset", err);
    return NextResponse.json({ error: "failed", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
