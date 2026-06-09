import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, PLAN_LIMITS } from "@/lib/plan";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { logs: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const pro = isPro(user);

  // Free plan: limit active (non-archived, non-locked) habits.
  if (!pro) {
    const activeCount = await prisma.habit.count({
      where: { userId: session.user.id, archived: false, locked: false },
    });
    if (activeCount >= PLAN_LIMITS.freeHabitLimit) {
      return NextResponse.json(
        {
          error: "habit_limit",
          message: `Free plan is limited to ${PLAN_LIMITS.freeHabitLimit} habits. Delete one to add another, or upgrade to Pro for unlimited.`,
        },
        { status: 403 }
      );
    }
  }

  const habit = await prisma.habit.create({
    data: {
      userId: session.user.id,
      name: data.name,
      description: data.description?.trim() || null,
      icon: data.icon ?? "✨",
      color: data.color ?? "#7f49c3",
      frequency: data.frequency ?? "daily",
      goal: data.goal ?? null,
      category: data.category ?? null,
      // Reminders are a Pro feature — ignore for free users.
      reminderTime: pro ? (data.reminderTime ?? null) : null,
    },
    include: { logs: true },
  });

  return NextResponse.json(habit);
}
