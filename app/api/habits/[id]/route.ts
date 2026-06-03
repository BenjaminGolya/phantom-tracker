import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const habit = await prisma.habit.update({
    where: { id: params.id, userId: session.user.id },
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency,
      goal: data.goal ?? null,
      category: data.category ?? null,
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
