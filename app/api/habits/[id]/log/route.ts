import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, completed, value } = await req.json();

  // Backfill window: only today and yesterday can be logged/edited. A 1-day
  // buffer on each side absorbs timezone skew between the client's local date
  // and the server clock (so "yesterday" is never wrongly rejected).
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }
  const dayMs = 86_400_000;
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const todayUtc = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  if (target > todayUtc + dayMs) {
    return NextResponse.json({ error: "future_date", message: "You can't log a future day." }, { status: 400 });
  }
  if (target < todayUtc - 2 * dayMs) {
    return NextResponse.json(
      { error: "too_old", message: "You can only log today or yesterday." },
      { status: 400 }
    );
  }

  const habit = await prisma.habit.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: params.id, date } },
    create: { habitId: params.id, date, completed, value: value ?? null },
    update: { completed, value: value ?? null },
  });

  return NextResponse.json(log);
}
