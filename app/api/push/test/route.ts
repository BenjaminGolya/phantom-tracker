import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await sendPushToUser(session.user.id, {
    title: "👻 Phantom Tracker",
    body: "Test notification. Your reminders are working!",
    url: "/dashboard",
    tag: "test",
  });

  if (result.total === 0) {
    return NextResponse.json({ error: "No devices subscribed" }, { status: 400 });
  }
  // ok only when at least one push was actually accepted by the push service
  return NextResponse.json({ ok: result.sent > 0, ...result });
}
