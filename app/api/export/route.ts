import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { logs: { orderBy: { date: "asc" } } },
  });

  const rows = ["habit_name,icon,category,date,completed,value"];
  for (const h of habits) {
    for (const log of h.logs) {
      rows.push(`"${h.name}","${h.icon}","${h.category ?? ""}","${log.date}",${log.completed},${log.value ?? ""}`);
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="phantom-tracker-export.csv"',
    },
  });
}
