import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, PLAN_LIMITS } from "@/lib/plan";

// Free user over the habit limit picks which habits to keep active. The chosen
// ones are unlocked; every other non-archived habit is locked (data preserved,
// hidden behind Pro). Used by the "choose what to keep" gate after Pro expires.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keepIds } = (await req.json()) as { keepIds?: string[] };
  if (!Array.isArray(keepIds)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (isPro(user)) {
    // Pro users have no limit - nothing to lock.
    return NextResponse.json({ ok: true });
  }

  if (keepIds.length > PLAN_LIMITS.freeHabitLimit) {
    return NextResponse.json(
      { error: "too_many", message: `You can keep up to ${PLAN_LIMITS.freeHabitLimit} habits on the free plan.` },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    select: { id: true },
  });
  const keep = new Set(keepIds.filter((id) => habits.some((h) => h.id === id)));

  await prisma.$transaction([
    prisma.habit.updateMany({
      where: { userId, archived: false, id: { in: Array.from(keep) } },
      data: { locked: false },
    }),
    prisma.habit.updateMany({
      where: { userId, archived: false, id: { notIn: Array.from(keep) } },
      data: { locked: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
