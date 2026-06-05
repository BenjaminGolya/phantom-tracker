// ─── Plan / entitlements (single source of truth) ─────────────────────────────
//
// Two plans: "free" and "pro" ($2/mo via Stripe). Everything that differs
// between plans is defined here so gating stays consistent across API + UI.

export type Plan = "free" | "pro";

/** Normalize whatever we have on a user into a Plan. */
export function isPro(user: { plan?: string | null } | null | undefined): boolean {
  return user?.plan === "pro";
}

export const PLAN_LIMITS = {
  /** Max active habits a free user can create. Pro = unlimited. */
  freeHabitLimit: 3,
  /** Pro users earn this multiplier on all profile XP. */
  proXpMultiplier: 1.5,
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

export const PRICE_LABEL = "$2/mo";
