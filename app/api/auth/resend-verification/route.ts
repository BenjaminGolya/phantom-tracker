import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true });

  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { verificationCode: code, verificationExpires: expires },
  });

  await sendVerificationEmail(email, code);
  return NextResponse.json({ ok: true });
}
