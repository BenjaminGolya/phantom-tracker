import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email, password, name, acceptedTerms, newsletterOptIn } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!acceptedTerms) {
    return NextResponse.json(
      { error: "You must accept the Terms of Service and Privacy Policy." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.emailVerified) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  if (existing && !existing.emailVerified) {
    // Resend code for unverified account
    await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        name: name ?? existing.name,
        acceptedTerms: true,
        acceptedTermsAt: new Date(),
        newsletterOptIn: !!newsletterOptIn,
        verificationCode: code,
        verificationExpires: expires,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        acceptedTerms: true,
        acceptedTermsAt: new Date(),
        newsletterOptIn: !!newsletterOptIn,
        verificationCode: code,
        verificationExpires: expires,
      },
    });
  }

  try {
    await sendVerificationEmail(email, code);
  } catch {
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, email });
}
