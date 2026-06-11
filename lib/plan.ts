// ─── Plan / entitlements (single source of truth) ─────────────────────────────
//
// Two plans: "free" and "pro" ($2/mo via Stripe). Everything that differs
// between plans is defined here so gating stays consistent across API + UI.

export type Plan = "free" | "pro";

/** Normalize whatever we have on a user into a Plan.
 *  Lifetime is always Pro. Otherwise plan must be "pro" and, if a comp expiry
 *  (`proUntil`) is set, it must still be in the future. `proUntil` is optional -
 *  callers that don't select it fall back to the DB `plan` flag (kept accurate
 *  by the expiry-downgrade cron). */
export function isPro(
  user: { plan?: string | null; lifetime?: boolean | null; proUntil?: Date | string | null } | null | undefined
): boolean {
  if (!user) return false;
  if (user.lifetime === true) return true;
  if (user.plan !== "pro") return false;
  if (user.proUntil) return new Date(user.proUntil).getTime() > Date.now();
  return true;
}

// ─── Habit visibility (free limit + Pro-locked habits) ────────────────────────
//
// A free user can keep up to `freeHabitLimit` active habits. If they end up over
// the limit (e.g. created extras while on Pro, then Pro expired), the surplus is
// "locked": kept on the account with full data, but hidden behind Pro. Pro users
// see everything (locked is ignored while subscribed).
export type LockableHabit = { archived: boolean; locked: boolean };

export function partitionHabits<T extends LockableHabit>(habits: T[], pro: boolean) {
  const visible = habits.filter((h) => !h.archived);
  if (pro) return { active: visible, locked: [] as T[] };
  return {
    active: visible.filter((h) => !h.locked),
    locked: visible.filter((h) => h.locked),
  };
}

/** True when a free user has more active habits than the free limit allows. */
export function isOverFreeLimit<T extends LockableHabit>(habits: T[], pro: boolean): boolean {
  if (pro) return false;
  return habits.filter((h) => !h.archived && !h.locked).length > PLAN_LIMITS.freeHabitLimit;
}

export const PLAN_LIMITS = {
  /** Max active habits a free user can create. Pro = unlimited. */
  freeHabitLimit: 4,
  /** Pro users earn this multiplier on all profile XP. */
  proXpMultiplier: 1.5,
  /** Diamond (lifetime) users earn an even bigger XP multiplier. */
  diamondXpMultiplier: 2,
  /**
   * Free profile level is capped at this level. Higher tiers (incl. the
   * Pro-exclusive tiers) require Pro. Pro = uncapped.
   */
  freeProfileLevelCap: 5,
} as const;

/** Feature flags, keyed for readability at call sites. */
export const PRO_FEATURES = {
  unlimitedHabits: true,
  reminders: true,
  advancedStats: true,
  xpBoost: true,
  exclusiveTiers: true,
} as const;

/** Free trial length for new Pro subscribers. */
export const TRIAL_DAYS = 14;

export const PRICE_LABEL = "€2/mo";
export const PRICE_LABEL_YEARLY = "€15/yr";
export const PRICE_LABEL_LIFETIME = "€29";
/** Effective monthly cost when paying yearly (€15 / 12 ≈ €1.25), for "save X%" copy. */
export const YEARLY_SAVINGS_PCT = Math.round((1 - 15 / (2 * 12)) * 100); // ~38%
