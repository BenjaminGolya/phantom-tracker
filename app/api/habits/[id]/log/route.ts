import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, completed, value } = await req.json();

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
