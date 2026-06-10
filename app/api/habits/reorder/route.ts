import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Persist a new habit order. Body: { ids: string[] } in the desired order.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = (await req.json()) as { ids?: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const userId = session.user.id;
  const owned = await prisma.habit.findMany({ where: { userId, id: { in: ids } }, select: { id: true } });
  const ownedIds = new Set(owned.map((h) => h.id));

  await prisma.$transaction(
    ids
      .filter((id) => ownedIds.has(id))
      .map((id, index) =>
        prisma.habit.update({ where: { id, userId }, data: { sortOrder: index } })
      )
  );

  return NextResponse.json({ ok: true });
}
