import { sendErrorAlert } from "@/lib/email";

// Throttle email alerts: at most one per context per window, so a recurring
// error can't flood the inbox. In-memory (per server process) is fine here.
const lastAlertAt = new Map<string, number>();
const ALERT_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Log a production error.
 *
 * - Always writes a structured line to stderr, which Hostinger captures in its
 *   Runtime Logs (filter by "Error" severity to find these).
 * - When `alert` is true, also emails the admin (throttled), so silent
 *   background failures (e.g. the reminder scheduler) reach you without you
 *   having to watch the logs.
 */
export function logError(context: string, error: unknown, opts: { alert?: boolean } = {}) {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[error] ${context} :: ${detail}`);

  if (opts.alert) {
    const now = Date.now();
    if (now - (lastAlertAt.get(context) ?? 0) > ALERT_THROTTLE_MS) {
      lastAlertAt.set(context, now);
      void sendErrorAlert(context, detail);
    }
  }
}
