import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro } from "@/lib/plan";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Export is a Pro feature.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!isPro(user)) {
    return NextResponse.json(
      { error: "pro_required", message: "Exporting data is a Pro feature." },
      { status: 403 }
    );
  }

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { logs: { orderBy: { date: "asc" } } },
  });

  const format = req.nextUrl.searchParams.get("format");

  // JSON backup — full fidelity, consumable by /api/import.
  if (format === "json") {
    const payload = {
      version: 1,
      app: "phantom-tracker",
      exportedAt: new Date().toISOString(),
      habits: habits.map((h) => ({
        name: h.name,
        icon: h.icon,
        color: h.color,
        frequency: h.frequency,
        goal: h.goal,
        category: h.category,
        reminderTime: h.reminderTime,
        archived: h.archived,
        logs: h.logs.map((l) => ({ date: l.date, completed: l.completed, value: l.value })),
      })),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="phantom-tracker-backup.json"',
      },
    });
  }

  // Default: CSV (human-friendly).
  const rows = ["habit_name,icon,category,date,completed,value"];
  for (const h of habits) {
    for (const log of h.logs) {
      rows.push(`"${h.name}","${h.icon}","${h.category ?? ""}","${log.date}",${log.completed},${log.value ?? ""}`);
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="phantom-tracker-export.csv"',
    },
  });
}
