import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, PLAN_LIMITS } from "@/lib/plan";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const pro = isPro(user);

  // Free plan: block un-archiving past the active-habit limit.
  if (!pro && data.archived === false) {
    const existing = await prisma.habit.findUnique({
      where: { id: params.id },
      select: { archived: true },
    });
    if (existing?.archived) {
      const activeCount = await prisma.habit.count({
        where: { userId: session.user.id, archived: false },
      });
      if (activeCount >= PLAN_LIMITS.freeHabitLimit) {
        return NextResponse.json(
          { error: "habit_limit", message: `Free plan is limited to ${PLAN_LIMITS.freeHabitLimit} active habits.` },
          { status: 403 }
        );
      }
    }
  }

  const habit = await prisma.habit.update({
    where: { id: params.id, userId: session.user.id },
    data: {
      name: data.name,
      description: data.description?.trim() || null,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency,
      goal: data.goal ?? null,
      category: data.category ?? null,
      // Reminders are Pro-only.
      reminderTime: pro ? (data.reminderTime ?? null) : null,
      archived: data.archived ?? false,
    },
    include: { logs: true },
  });

  return NextResponse.json(habit);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.habit.delete({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
