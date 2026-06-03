import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
