import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendTwoFactorCodeEmail } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

function gen(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Verifies credentials WITHOUT creating a session, so the login form knows
// whether to ask for a 2FA code. If 2FA is on, it sends the code here.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ valid: false });

  try {
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user || !user.emailVerified) return NextResponse.json({ valid: false });

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return NextResponse.json({ valid: false });

    if (user.twoFactorEnabled) {
      const code = gen();
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCode: code, twoFactorCodeExpires: new Date(Date.now() + 10 * 60 * 1000) },
      });
      try { await sendTwoFactorCodeEmail(user.email, code, user.name, user.language); }
      catch (e) { logError("auth/precheck:email", e); }
      return NextResponse.json({ valid: true, twoFactor: true });
    }

    return NextResponse.json({ valid: true, twoFactor: false });
  } catch (err) {
    logError("auth/precheck", err);
    return NextResponse.json({ valid: false });
  }
}
