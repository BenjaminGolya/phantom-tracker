import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/notifications/read -> mark notifications read.
//   body: { id?: string }  (omit id to mark ALL read)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let id: string | undefined;
  try {
    id = (await req.json())?.id;
  } catch {
    /* no body -> mark all */
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
