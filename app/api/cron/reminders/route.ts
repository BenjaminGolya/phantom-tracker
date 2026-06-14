import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { calcStreak, isScheduledOnParts } from "@/lib/utils";
import { logError } from "@/lib/log";

// Daily streak-protection nudge fires at this local hour if a habit has a
// streak worth saving and today isn't done yet.
const STREAK_NUDGE_HHMM = "19:00";
const STREAK_NUDGE_MIN = 3; // first streak length that earns a daily nudge

export const dynamic = "force-dynamic";

// Idempotency guard: has this exact notification already been recorded for the
// user recently? Reminders/nudges fire once per day at a fixed minute, so a
// lookback window safely blocks duplicate sends from an over-eager cron (retries
// or sub-minute schedules) without ever skipping a legitimate daily send.
async function alreadyNotified(
  userId: string,
  icon: string,
  title: string | undefined,
  withinMs: number
): Promise<boolean> {
  const dup = await prisma.notification.findFirst({
    where: {
      userId,
      icon,
      ...(title ? { title } : {}),
      createdAt: { gte: new Date(Date.now() - withinMs) },
    },
    select: { id: true },
  });
  return !!dup;
}

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

  try {
    const downgraded = await downgradeExpiredComps();
    const reminders = await runReminders();
    const nudges = await runStreakNudges();
    return NextResponse.json({ ok: true, downgraded, reminders, nudges });
  } catch (err) {
    // Critical background job - alert the admin if it breaks.
    logError("cron/reminders", err, { alert: true });
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 });
  }
}

// Lapse admin-granted, time-limited Pro comps once their expiry passes. Leaves
// Stripe subscribers and lifetime users untouched. Keeps the DB `plan` flag
// authoritative for the many routes that only select `plan`.
async function downgradeExpiredComps(): Promise<number> {
  const res = await prisma.user.updateMany({
    where: {
      plan: "pro",
      lifetime: false,
      stripeSubscriptionId: null,
      proUntil: { not: null, lt: new Date() },
    },
    data: { plan: "free" },
  });
  return res.count;
}

// One daily push per user when they have a meaningful streak that isn't done
// today. Available to everyone with notifications on (not a Pro-only reminder).
async function runStreakNudges(): Promise<number> {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: { disabledAt: null, deletionRequestedAt: null, pushSubscriptions: { some: {} } },
    select: {
      id: true, timezone: true, plan: true,
      habits: {
        where: { archived: false, locked: false },
        select: { id: true, name: true, frequency: true, reminderTime: true, logs: { select: { date: true, completed: true } } },
      },
    },
  });

  let sent = 0;
  for (const u of users) {
    if (!u.timezone || !u.habits.length) continue;
    let local;
    try { local = inTz(now, u.timezone); } catch { continue; }
    if (local.hhmm !== STREAK_NUDGE_HHMM) continue;

    // Pick the habit with the longest current streak that's scheduled today and
    // still undone - the one most worth protecting.
    let best: { name: string; streak: number } | null = null;
    const dayOfMonth = parseInt(local.date.slice(8, 10), 10);
    for (const h of u.habits) {
      // Skip habits that already get their own timed reminder (Pro) - otherwise
      // the user would receive the reminder AND this nudge for the same habit.
      if (u.plan === "pro" && h.reminderTime) continue;
      if (!isScheduledOnParts(h.frequency, local.weekday, dayOfMonth)) continue;
      if (h.logs.some((l) => l.date === local.date && l.completed)) continue; // already done
      const streak = calcStreak(h.logs).current;
      if (streak >= STREAK_NUDGE_MIN && (!best || streak > best.streak)) best = { name: h.name, streak };
    }
    if (!best) continue;

    // Only one streak nudge per user per day, even if the cron runs repeatedly.
    if (await alreadyNotified(u.id, "streak", undefined, 6 * 60 * 60 * 1000)) continue;

    await notifyUser(u.id, {
      title: `🔥 ${best.streak}-day streak`,
      body: `Don't break it - complete "${best.name}" to keep your streak alive.`,
      url: "/dashboard",
      icon: "streak",
      tag: "streak-nudge",
    });
    sent++;
  }
  return sent;
}

async function runReminders() {
  const now = new Date();
  const habits = await prisma.habit.findMany({
    where: { archived: false, reminderTime: { not: null } },
    include: {
      user: { select: { id: true, timezone: true, plan: true } },
      logs: true,
    },
  });

  let sent = 0;
  for (const habit of habits) {
    const tz = habit.user.timezone;
    if (!tz || !habit.reminderTime) continue;

    // Reminders are a Pro feature - skip free users.
    if (habit.user.plan !== "pro") continue;

    let local;
    try {
      local = inTz(now, tz);
    } catch {
      continue; // invalid timezone string
    }

    // Only fire on the exact minute the reminder is set for
    if (habit.reminderTime !== local.hhmm) continue;

    // Respect the habit's schedule (daily / weekly weekdays / monthly days).
    if (!isScheduledOnParts(habit.frequency, local.weekday, parseInt(local.date.slice(8, 10), 10))) continue;

    // Don't nag if it's already done today
    const doneToday = habit.logs.some((l) => l.date === local.date && l.completed);
    if (doneToday) continue;

    // Only one reminder per habit per fire, even if the cron runs more than once
    // in this minute (or retries). Matches on the habit-specific title.
    if (await alreadyNotified(habit.user.id, "reminder", `⏰ ${habit.name}`, 60 * 60 * 1000)) continue;

    await notifyUser(habit.user.id, {
      title: `⏰ ${habit.name}`,
      body: `Time to complete "${habit.name}". Tap to mark it done.`,
      url: "/dashboard",
      icon: "reminder",
      tag: `habit-${habit.id}`,
    });
    sent++;
  }

  return sent;
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
