import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enable } = await req.json().catch(() => ({}));

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: !!enable,
        // Clear any pending code when toggling.
        twoFactorCode: null,
        twoFactorCodeExpires: null,
      },
    });
    return NextResponse.json({ ok: true, enabled: !!enable });
  } catch (err) {
    logError("account/2fa", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
