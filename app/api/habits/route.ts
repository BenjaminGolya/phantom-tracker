import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const habit = await prisma.habit.create({
    data: {
      userId: session.user.id,
      name: data.name,
      icon: data.icon ?? "✨",
      color: data.color ?? "#7f49c3",
      frequency: data.frequency ?? "daily",
      goal: data.goal ?? null,
      category: data.category ?? null,
    },
    include: { logs: true },
  });

  return NextResponse.json(habit);
}
