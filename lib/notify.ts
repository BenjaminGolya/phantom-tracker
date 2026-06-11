import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { logError } from "@/lib/log";

export interface NotifyPayload {
  title: string;
  body: string;
  url?: string;
  /** Short type hint (e.g. "reminder", "streak", "billing") for the bell icon. */
  icon?: string;
  /** Push grouping tag. */
  tag?: string;
}

/** Store an in-app notification (shows in the notification center). */
export async function createNotification(userId: string, p: NotifyPayload) {
  try {
    await prisma.notification.create({
      data: { userId, title: p.title, body: p.body, url: p.url ?? null, icon: p.icon ?? null },
    });
  } catch (e) {
    logError("notify/create", e);
  }
}

/**
 * Notify a user both ways: record an in-app notification (always) and send a
 * web push (best-effort, only to users with a push subscription).
 */
export async function notifyUser(userId: string, p: NotifyPayload) {
  await createNotification(userId, p);
  try {
    await sendPushToUser(userId, { title: p.title, body: p.body, url: p.url, tag: p.tag });
  } catch (e) {
    logError("notify/push", e);
  }
}
