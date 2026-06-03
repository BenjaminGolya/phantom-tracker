import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, startOfYear, eachDayOfInterval, endOfYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function getYearDays(year: number): string[] {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function calcStreak(logs: { date: string; completed: boolean }[]): {
  current: number;
  longest: number;
} {
  const completed = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  const today = format(new Date(), "yyyy-MM-dd");
  let current = 0;
  let offset = 0;

  while (true) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - offset);
    const key = format(cursor, "yyyy-MM-dd");
    if (!completed.has(key)) {
      if (key === today) { offset++; continue; }
      break;
    }
    current++;
    offset++;
  }

  const sorted = Array.from(completed).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of sorted) {
    const cur = parseISO(s);
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { run++; }
      else { longest = Math.max(longest, run); run = 1; }
    } else { run = 1; }
    prev = cur;
  }
  longest = Math.max(longest, run);
  return { current, longest };
}

export function calcCompletionRate(
  logs: { date: string; completed: boolean }[],
  days = 30
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = logs.filter((l) => parseISO(l.date) >= cutoff);
  if (!recent.length) return 0;
  return Math.round((recent.filter((l) => l.completed).length / recent.length) * 100);
}

// ─── Habit level system (unlimited) ──────────────────────────────────────────
//
// Levels are infinite. XP cost scales quadratically so early levels feel
// rewarding and higher levels are a genuine long-term goal.
//
// Tiers gate every ~3 levels and control the badge color + letter:
//   F (1-3) → E (4-6) → D (7-9) → C (10-12) → B (13-15) → A (16-18) → S (19+)

export const LEVELS = [
  { minLevel: 1,  label: "Seed",     emoji: "🌱", color: "#6b7280" },
  { minLevel: 4,  label: "Sprout",   emoji: "🌿", color: "#22c55e" },
  { minLevel: 7,  label: "Grower",   emoji: "🌳", color: "#3b82f6" },
  { minLevel: 10, label: "Achiever", emoji: "⚡", color: "#a855f7" },
  { minLevel: 13, label: "Expert",   emoji: "🔥", color: "#f97316" },
  { minLevel: 16, label: "Champion", emoji: "👑", color: "#eab308" },
  { minLevel: 19, label: "Legend",   emoji: "💎", color: "#7f49c3" },
];

/** XP required to reach a given level (1-indexed, unlimited). */
export function habitLevelXP(level: number): number {
  if (level <= 1) return 0;
  return Math.round(Math.pow(level - 1, 2.2) * 6);
}

export type LevelInfo = {
  level: number; label: string; emoji: string; color: string;
  xp: number; xpRequired: number; xpNext: number; progress: number; isMax: boolean;
};

export function getHabitLevel(logs: { completed: boolean }[]): LevelInfo {
  const xp = logs.filter((l) => l.completed).length;

  // Walk up until the next level costs more XP than we have
  let level = 1;
  while (habitLevelXP(level + 1) <= xp) level++;

  // Tier = highest tier whose minLevel ≤ current level
  const tier = [...LEVELS].reverse().find((t) => level >= t.minLevel) ?? LEVELS[0];

  const xpRequired = habitLevelXP(level);
  const xpNext = habitLevelXP(level + 1);
  const progress = Math.min(100, Math.round(((xp - xpRequired) / (xpNext - xpRequired)) * 100));

  // Next tier (for XP bar preview)
  const nextTier = LEVELS.find((t) => t.minLevel > level) ?? null;

  return {
    level,
    label: tier.label,
    emoji: tier.emoji,
    color: tier.color,
    xp,
    xpRequired,
    xpNext,
    progress,
    isMax: false,
    // Extra fields consumed by XPBar / badge
    ...(nextTier ? { nextTierEmoji: nextTier.emoji, nextTierLabel: nextTier.label, nextTierColor: nextTier.color, nextTierMinLevel: nextTier.minLevel } : {}),
  } as LevelInfo & { nextTierEmoji?: string; nextTierLabel?: string; nextTierColor?: string; nextTierMinLevel?: number };
}

// ─── Profile level system ─────────────────────────────────────────────────────
//
// XP sources (shown transparently in stats):
//   • Base XP       — 1 XP per completion
//   • Streak bonus  — +1 XP/completion at 7d streak, +2 at 14d, +3 at 30d
//   • Perfect day   — +5 XP for every day ALL habits were completed
//   • Diversity     — +10 XP per unique category tracked (up to 5)
//   • Habit mastery — +20 XP each time a habit reaches a new level

export const PROFILE_LEVELS = [
  { level: 1,  label: "Wanderer",    emoji: "🌫️", color: "#6b7280", xpRequired: 0    },
  { level: 2,  label: "Initiate",    emoji: "🕯️", color: "#64748b", xpRequired: 50   },
  { level: 3,  label: "Seeker",      emoji: "🔍", color: "#3b82f6", xpRequired: 150  },
  { level: 4,  label: "Builder",     emoji: "🏗️", color: "#06b6d4", xpRequired: 350  },
  { level: 5,  label: "Warrior",     emoji: "⚔️", color: "#22c55e", xpRequired: 700  },
  { level: 6,  label: "Champion",    emoji: "🏆", color: "#a855f7", xpRequired: 1200 },
  { level: 7,  label: "Master",      emoji: "🔥", color: "#f97316", xpRequired: 2000 },
  { level: 8,  label: "Grandmaster", emoji: "👑", color: "#eab308", xpRequired: 3500 },
  { level: 9,  label: "Legend",      emoji: "💎", color: "#7f49c3", xpRequired: 6000 },
  { level: 10, label: "Phantom",     emoji: "👻", color: "#7f49c3", xpRequired: 10000},
];

export type XPBreakdown = {
  base: number;
  streakBonus: number;
  perfectDays: number;
  diversity: number;
  masteryBonus: number;
  total: number;
};

export type ProfileLevelInfo = LevelInfo & { breakdown: XPBreakdown };

export function calcProfileXP(
  habits: { logs: { date: string; completed: boolean }[]; category: string | null }[]
): XPBreakdown {
  if (!habits.length) return { base: 0, streakBonus: 0, perfectDays: 0, diversity: 0, masteryBonus: 0, total: 0 };

  // Base XP: 1 per completion
  const base = habits.reduce((acc, h) => acc + h.logs.filter((l) => l.completed).length, 0);

  // Streak bonus: computed per-habit, per completed day (streak at that point)
  let streakBonus = 0;
  for (const habit of habits) {
    const sortedDates = habit.logs
      .filter((l) => l.completed)
      .map((l) => l.date)
      .sort();
    let run = 0;
    let prev: string | null = null;
    for (const date of sortedDates) {
      if (prev) {
        const diff = (parseISO(date).getTime() - parseISO(prev).getTime()) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      prev = date;
      if (run >= 30) streakBonus += 3;
      else if (run >= 14) streakBonus += 2;
      else if (run >= 7) streakBonus += 1;
    }
  }

  // Perfect days: every day where ALL habits have a completion
  const allDates = new Set(
    habits.flatMap((h) => h.logs.filter((l) => l.completed).map((l) => l.date))
  );
  let perfectDays = 0;
  for (const date of Array.from(allDates)) {
    const allDone = habits.every((h) => h.logs.some((l) => l.date === date && l.completed));
    if (allDone) perfectDays++;
  }
  const perfectDayXP = perfectDays * 5;

  // Diversity: 10 XP per unique category (max 5)
  const uniqueCategories = new Set(habits.map((h) => h.category).filter(Boolean));
  const diversity = Math.min(uniqueCategories.size, 5) * 10;

  // Mastery bonus: 20 XP each time a habit crosses a tier threshold
  let masteryBonus = 0;
  for (const habit of habits) {
    const { level } = getHabitLevel(habit.logs);
    // Count how many tier thresholds (minLevel > 1) have been crossed
    const tiersUnlocked = LEVELS.filter((t) => t.minLevel > 1 && level >= t.minLevel).length;
    masteryBonus += tiersUnlocked * 20;
  }

  const total = base + streakBonus + perfectDayXP + diversity + masteryBonus;
  return { base, streakBonus, perfectDays: perfectDayXP, diversity, masteryBonus, total };
}

export function getProfileLevel(
  habits: { logs: { date: string; completed: boolean }[]; category: string | null }[]
): ProfileLevelInfo {
  const breakdown = calcProfileXP(habits);
  const xp = breakdown.total;
  let current = PROFILE_LEVELS[0];
  for (const lvl of PROFILE_LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  const idx = PROFILE_LEVELS.findIndex((l) => l.level === current.level);
  const isMax = idx === PROFILE_LEVELS.length - 1;
  const next = isMax ? null : PROFILE_LEVELS[idx + 1];
  const xpIntoLevel = xp - current.xpRequired;
  const xpSpan = next ? next.xpRequired - current.xpRequired : 1;
  const progress = isMax ? 100 : Math.min(100, Math.round((xpIntoLevel / xpSpan) * 100));
  return {
    level: current.level, label: current.label, emoji: current.emoji, color: current.color,
    xp, xpRequired: current.xpRequired, xpNext: next ? next.xpRequired : current.xpRequired,
    progress, isMax, breakdown,
  };
}

export function phantomScore(
  habits: { logs: { date: string; completed: boolean }[] }[]
): number {
  if (!habits.length) return 0;
  const rates = habits.map((h) => calcCompletionRate(h.logs, 7));
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}
