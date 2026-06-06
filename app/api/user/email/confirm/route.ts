import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}

// Clicked from the confirmation email — token-based, no session required.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirectTo(req, "/login?emailChange=invalid");

  try {
    const user = await prisma.user.findUnique({ where: { emailChangeToken: token } });
    if (!user || !user.pendingEmail || !user.emailChangeExpires) {
      return redirectTo(req, "/login?emailChange=invalid");
    }
    if (user.emailChangeExpires.getTime() < Date.now()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingEmail: null, emailChangeToken: null, emailChangeExpires: null },
      });
      return redirectTo(req, "/login?emailChange=expired");
    }

    // Last-moment guard: make sure the address wasn't claimed meanwhile.
    const taken = await prisma.user.findUnique({ where: { email: user.pendingEmail } });
    if (taken && taken.id !== user.id) {
      return redirectTo(req, "/login?emailChange=taken");
    }

    const newEmail = user.pendingEmail;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpires: null,
      },
    });

    // The active session's email is now stale — send them to log in fresh.
    return redirectTo(req, `/login?emailChanged=1&email=${encodeURIComponent(newEmail)}`);
  } catch (err) {
    logError("user/email/confirm", err);
    return redirectTo(req, "/login?emailChange=error");
  }
}
