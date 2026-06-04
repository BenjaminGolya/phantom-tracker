import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await sendPushToUser(session.user.id, {
    title: "👻 Phantom Tracker",
    body: "Test notification — your reminders are working!",
    url: "/dashboard",
    tag: "test",
  });

  if (count === 0) {
    return NextResponse.json({ error: "No devices subscribed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, sent: count });
}
