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

// Split one CSV line, honoring quoted fields with embedded commas / quotes.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Parse a CSV export (Phantom Tracker format, but header-flexible) into the same
// shape as the JSON import: one habit per name, with its logs.
function parseCsv(text: string): ImportHabit[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const find = (names: string[]) => {
    for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; }
    return -1;
  };
  const ni = find(["habit_name", "habit", "name"]);
  const di = find(["date"]);
  const ci = find(["completed", "done"]);
  const vi = find(["value", "count"]);
  const cati = find(["category"]);
  const ici = find(["icon"]);
  if (ni < 0 || di < 0) return []; // need at least a name + date column

  const map = new Map<string, ImportHabit & { logs: ImportLog[] }>();
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]);
    const name = (cols[ni] ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    let h = map.get(key);
    if (!h) {
      h = {
        name,
        icon: ici >= 0 ? (cols[ici] || undefined) : undefined,
        category: cati >= 0 ? (cols[cati] || undefined) : undefined,
        logs: [],
      };
      map.set(key, h);
    }
    const date = (cols[di] ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const completedRaw = (ci >= 0 ? cols[ci] : "true").trim().toLowerCase();
      const completed = ["true", "1", "yes", "y"].includes(completedRaw);
      const valueRaw = (vi >= 0 ? cols[vi] : "").trim();
      const valueNum = valueRaw === "" ? null : Number(valueRaw);
      h.logs.push({ date, completed, value: Number.isFinite(valueNum as number) ? valueNum : null });
    }
  }
  return Array.from(map.values());
}

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

  // Accept either a JSON backup or a CSV export.
  const raw = (await req.text()).trim();
  if (!raw) {
    return NextResponse.json({ error: "empty", message: "The file was empty." }, { status: 400 });
  }

  let habits: ImportHabit[] | null = null;
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) habits = parsed as ImportHabit[];
      else if (Array.isArray((parsed as { habits?: unknown })?.habits)) habits = (parsed as { habits: ImportHabit[] }).habits;
    } catch {
      return NextResponse.json({ error: "invalid_json", message: "That JSON file couldn't be read." }, { status: 400 });
    }
  } else {
    habits = parseCsv(raw);
  }

  if (!habits || !habits.length) {
    return NextResponse.json(
      { error: "invalid_format", message: "Expected a Phantom Tracker JSON backup or a CSV export (with habit name and date columns)." },
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
