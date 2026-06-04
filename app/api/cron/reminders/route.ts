import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Compute the user's local time pieces for a given instant.
function inTz(now: Date, tz: string) {
  const hhmm = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short",
  }).format(now).toLowerCase(); // "mon", "tue", ...
  return { hhmm, date, weekday };
}

async function handle(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const habits = await prisma.habit.findMany({
    where: { archived: false, reminderTime: { not: null } },
    include: {
      user: { select: { id: true, timezone: true } },
      logs: true,
    },
  });

  let sent = 0;
  for (const habit of habits) {
    const tz = habit.user.timezone;
    if (!tz || !habit.reminderTime) continue;

    let local;
    try {
      local = inTz(now, tz);
    } catch {
      continue; // invalid timezone string
    }

    // Only fire on the exact minute the reminder is set for
    if (habit.reminderTime !== local.hhmm) continue;

    // Respect custom-day frequency (e.g. "mon,wed,fri")
    if (habit.frequency !== "daily") {
      const days = habit.frequency.split(",").map((d) => d.trim());
      if (!days.includes(local.weekday)) continue;
    }

    // Don't nag if it's already done today
    const doneToday = habit.logs.some((l) => l.date === local.date && l.completed);
    if (doneToday) continue;

    await sendPushToUser(habit.user.id, {
      title: `⏰ ${habit.name}`,
      body: `Time to complete "${habit.name}" — tap to mark it done.`,
      url: "/dashboard",
      tag: `habit-${habit.id}`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, checked: habits.length, sent });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
