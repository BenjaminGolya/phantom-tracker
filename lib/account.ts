// Account-lifecycle constants shared by client + server.

/** Days a deletion-requested account is kept before its data is purged. */
export const DELETION_GRACE_DAYS = 30;

/** The date a deletion-requested account will be permanently purged. */
export function purgeDate(requestedAt: Date | string): Date {
  const d = new Date(requestedAt);
  d.setDate(d.getDate() + DELETION_GRACE_DAYS);
  return d;
}

/** Whole days left before purge (rounded up, min 0). */
export function daysUntilPurge(requestedAt: Date | string): number {
  const ms = purgeDate(requestedAt).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
