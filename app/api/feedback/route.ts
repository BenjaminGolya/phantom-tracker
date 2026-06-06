import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackEmail } from "@/lib/email";
import { APP_VERSION } from "@/lib/version";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

const TYPES = ["bug", "question", "feedback"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = TYPES.includes(body?.type) ? body.type : "feedback";
  const message = String(body?.message ?? "").trim();

  if (message.length < 5) {
    return NextResponse.json({ error: "too_short", message: "Please add a bit more detail." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "too_long", message: "Please keep it under 5000 characters." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const res = await sendFeedbackEmail({
      fromEmail: user.email,
      fromName: user.name,
      type,
      message,
      appVersion: APP_VERSION,
    });

    if (!res.ok) {
      return NextResponse.json({ error: "unavailable", message: "Couldn't send right now — please try again later." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api/feedback", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
