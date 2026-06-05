import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DELETION_GRACE_DAYS } from "@/lib/account";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

// Permanently deletes accounts whose deletion grace period has elapsed.
// Deleting the User row cascades to habits, logs, sessions, accounts and
// push subscriptions (onDelete: Cascade in the schema).
async function handle(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DELETION_GRACE_DAYS);

    const due = await prisma.user.findMany({
      where: { deletionRequestedAt: { not: null, lt: cutoff } },
      select: { id: true, email: true },
    });

    if (due.length) {
      await prisma.user.deleteMany({
        where: { id: { in: due.map((u) => u.id) } },
      });
    }

    return NextResponse.json({ ok: true, purged: due.length });
  } catch (err) {
    logError("cron/purge-accounts", err, { alert: true });
    return NextResponse.json({ error: "purge failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
