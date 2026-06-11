import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

export const dynamic = "force-dynamic";

// Resolve the current session and ensure it belongs to an admin.
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminEmail(session.user.email)) return null;
  return session;
}

// PATCH /api/admin/users/:id - { action, data? }
//   action: "disable" | "enable" | "grantPro" | "revokePro" | "update"
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  const isSelf = id === session.user.id;

  let body: { action?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { action, data } = body;

  try {
    switch (action) {
      case "disable": {
        // Don't let an admin lock themselves out.
        if (isSelf) return NextResponse.json({ error: "You can't disable your own account." }, { status: 400 });
        await prisma.user.update({ where: { id }, data: { disabledAt: new Date() } });
        break;
      }
      case "enable": {
        await prisma.user.update({ where: { id }, data: { disabledAt: null, deletionRequestedAt: null } });
        break;
      }
      case "grantPro": {
        const now = new Date();
        if (data?.lifetime === true) {
          // Permanent comp (no expiry, independent of Stripe).
          await prisma.user.update({ where: { id }, data: { plan: "pro", lifetime: true, proUntil: null, proSince: now } });
        } else {
          const months = Math.max(1, Math.min(120, Math.round(Number(data?.months) || 1)));
          const current = await prisma.user.findUnique({ where: { id }, select: { proUntil: true, stripeSubscriptionId: true } });
          // An active Stripe subscriber is already unlimited Pro - setting a
          // comp expiry would wrongly lapse them later. Nothing to grant.
          if (current?.stripeSubscriptionId) {
            return NextResponse.json({ error: "User has an active subscription - already Pro with no expiry." }, { status: 400 });
          }
          // Extend from an existing future expiry if there is one, else from now.
          const base = current?.proUntil && current.proUntil.getTime() > now.getTime() ? current.proUntil : now;
          const until = new Date(base);
          until.setMonth(until.getMonth() + months);
          await prisma.user.update({ where: { id }, data: { plan: "pro", lifetime: false, proUntil: until, proSince: now } });
        }
        break;
      }
      case "revokePro": {
        // Revoke only the comp. A paying Stripe subscriber keeps plan=pro -
        // their subscription, not the comp, is what makes them Pro.
        const current = await prisma.user.findUnique({ where: { id }, select: { stripeSubscriptionId: true } });
        await prisma.user.update({
          where: { id },
          data: { plan: current?.stripeSubscriptionId ? "pro" : "free", lifetime: false, proUntil: null },
        });
        break;
      }
      case "update": {
        const update: { name?: string | null; email?: string } = {};
        if (typeof data?.name === "string") update.name = data.name.trim() || null;
        if (typeof data?.email === "string") {
          const email = data.email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email." }, { status: 400 });
          }
          const clash = await prisma.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } });
          if (clash) return NextResponse.json({ error: "That email is already in use." }, { status: 400 });
          update.email = email;
        }
        if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
        await prisma.user.update({ where: { id }, data: update });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("admin/users:patch", err);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id - permanent (cascades to all user data)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account here." }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("admin/users:delete", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
