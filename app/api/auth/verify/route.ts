import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewUserNotification, sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true }); // already verified
  }

  if (!user.verificationCode || !user.verificationExpires) {
    return NextResponse.json({ error: "No verification code found" }, { status: 400 });
  }

  if (new Date() > user.verificationExpires) {
    return NextResponse.json({ error: "Code expired — please register again to get a new one" }, { status: 400 });
  }

  if (user.verificationCode !== code) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      verificationCode: null,
      verificationExpires: null,
    },
  });

  // Best-effort emails — never block the signup if they fail.
  try {
    await Promise.allSettled([
      sendWelcomeEmail(user.email, user.name),
      sendNewUserNotification({ email: user.email, name: user.name }),
    ]);
  } catch (err) {
    console.error("Post-verification emails failed:", err);
  }

  return NextResponse.json({ ok: true });
}
