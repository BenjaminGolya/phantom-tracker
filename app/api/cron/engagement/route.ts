import { NextRequest, NextResponse } from "next/server";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calcStreak } from "@/lib/utils";
import { sendWeeklySummaryEmail, sendTrialEndingEmail } from "@/lib/email";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

// Daily engagement job: weekly "your week in review" summaries (gated to ~weekly
// per user) and Pro trial-ending reminders. Schedule this to run once per day.
async function handle(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summaries = await runWeeklySummaries();
    const trials = await runTrialReminders();
    return NextResponse.json({ ok: true, summaries, trials });
  } catch (err) {
    logError("cron/engagement", err, { alert: true });
    return NextResponse.json({ error: "Engagement run failed" }, { status: 500 });
  }
}

async function runWeeklySummaries(): Promise<number> {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(now, i), "yyyy-MM-dd"));

  const users = await prisma.user.findMany({
    where: {
      disabledAt: null,
      deletionRequestedAt: null,
      emailVerified: { not: null },
      OR: [{ lastWeeklySummary: null }, { lastWeeklySummary: { lt: weekAgo } }],
    },
    select: {
      id: true, email: true, name: true, language: true,
      habits: {
        where: { archived: false, locked: false },
        select: { logs: { select: { date: true, completed: true } } },
      },
    },
  });

  let sent = 0;
  for (const u of users) {
    if (!u.habits.length) continue;

    const completions = u.habits.reduce(
      (n, h) => n + h.logs.filter((l) => l.completed && last7.includes(l.date)).length,
      0
    );
    if (completions === 0) continue; // only email active users

    const bestStreak = Math.max(0, ...u.habits.map((h) => calcStreak(h.logs).current));
    const perfectDays = last7.filter((d) =>
      u.habits.every((h) => h.logs.some((l) => l.date === d && l.completed))
    ).length;

    try {
      await sendWeeklySummaryEmail({
        to: u.email, name: u.name, lang: u.language,
        completions, bestStreak, perfectDays,
      });
      await prisma.user.update({ where: { id: u.id }, data: { lastWeeklySummary: now } });
      sent++;
    } catch (e) {
      logError("cron/engagement:weekly", e);
    }
  }
  return sent;
}

async function runTrialReminders(): Promise<number> {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // +48h

  const users = await prisma.user.findMany({
    where: {
      plan: "pro",
      trialReminderSent: false,
      trialEndsAt: { not: null, gt: now, lte: soon },
      disabledAt: null,
      deletionRequestedAt: null,
    },
    select: { id: true, email: true, name: true, language: true, trialEndsAt: true },
  });

  let sent = 0;
  for (const u of users) {
    const daysLeft = Math.max(1, differenceInCalendarDays(u.trialEndsAt!, now));
    try {
      await sendTrialEndingEmail({ to: u.email, name: u.name, lang: u.language, daysLeft });
      await prisma.user.update({ where: { id: u.id }, data: { trialReminderSent: true } });
      sent++;
    } catch (e) {
      logError("cron/engagement:trial", e);
    }
  }
  return sent;
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
