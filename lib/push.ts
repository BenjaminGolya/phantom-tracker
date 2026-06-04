import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@phantomtracker.io",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushResult {
  total: number;
  sent: number;
  errors: { statusCode?: number; message?: string }[];
}

/** Send a push to every subscription belonging to a user. Cleans up dead subs. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  configure();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  let sent = 0;
  const errors: { statusCode?: number; message?: string }[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        const e = err as { statusCode?: number; body?: string; message?: string };
        const code = e?.statusCode;
        errors.push({ statusCode: code, message: String(e?.body || e?.message || "").slice(0, 180) });
        // 404/410 = the subscription is gone (browser/app uninstalled) → drop it
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        } else {
          // Unexpected push failure (e.g. bad VAPID config) — worth seeing in logs
          logError("push/send", `statusCode=${code}: ${e?.body || e?.message || "unknown"}`);
        }
      }
    })
  );

  return { total: subs.length, sent, errors };
}
