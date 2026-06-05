import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro } from "@/lib/plan";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

type ImportLog = { date?: unknown; completed?: unknown; value?: unknown };
type ImportHabit = {
  name?: unknown;
  icon?: unknown;
  color?: unknown;
  frequency?: unknown;
  goal?: unknown;
  category?: unknown;
  reminderTime?: unknown;
  archived?: unknown;
  logs?: unknown;
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Import is a Pro feature.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!isPro(user)) {
    return NextResponse.json(
      { error: "pro_required", message: "Importing data is a Pro feature." },
      { status: 403 }
    );
  }

  let body: { habits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const habits = Array.isArray(body?.habits) ? (body.habits as ImportHabit[]) : null;
  if (!habits) {
    return NextResponse.json(
      { error: "invalid_format", message: "Expected a Phantom Tracker backup file with a 'habits' array." },
      { status: 400 }
    );
  }

  try {
    // Existing habit names → merge logs into them instead of duplicating.
    const existing = await prisma.habit.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    });
    const byName = new Map(existing.map((h) => [h.name.toLowerCase(), h.id]));

    let habitsCreated = 0;
    let logsImported = 0;

    for (const h of habits) {
      const name = str(h.name).trim();
      if (!name) continue;

      let habitId = byName.get(name.toLowerCase());
      if (!habitId) {
        const created = await prisma.habit.create({
          data: {
            userId: session.user.id,
            name,
            icon: str(h.icon, "✨"),
            color: str(h.color, "#7f49c3"),
            frequency: str(h.frequency, "daily"),
            goal: num(h.goal),
            category: typeof h.category === "string" ? h.category : null,
            reminderTime: typeof h.reminderTime === "string" ? h.reminderTime : null,
            archived: h.archived === true,
          },
        });
        habitId = created.id;
        byName.set(name.toLowerCase(), habitId);
        habitsCreated++;
      }

      const logs = Array.isArray(h.logs) ? (h.logs as ImportLog[]) : [];
      const validLogs = logs
        .filter((l) => typeof l.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.date))
        .map((l) => ({
          habitId: habitId!,
          date: l.date as string,
          completed: l.completed === true,
          value: num(l.value),
        }));

      if (validLogs.length) {
        // Skip logs that already exist for that habit/date (unique constraint).
        const res = await prisma.habitLog.createMany({
          data: validLogs,
          skipDuplicates: true,
        });
        logsImported += res.count;
      }
    }

    return NextResponse.json({ ok: true, habitsCreated, logsImported });
  } catch (err) {
    logError("api/import", err);
    return NextResponse.json({ error: "import_failed" }, { status: 500 });
  }
}
