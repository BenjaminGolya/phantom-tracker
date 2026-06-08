// Derives a "type of person" read from a user's habits: five 0..1 trait scores,
// a dominant personality label, and growth metrics that drive the planet.
// Pure & client-safe (no server-only imports).

import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { calcStreak, calcCompletionRate, getProfileLevel } from "./utils";

export type TraitHabit = {
  logs: { date: string; completed: boolean }[];
  category: string | null;
};

export type TraitKey = "consistency" | "discipline" | "variety" | "dedication" | "momentum";

export type Traits = {
  scores: Record<TraitKey, number>; // 0..1
  dominant: TraitKey;
  /** i18n key suffix for the personality label, e.g. "type.explorer". */
  typeKey: string;
  level: number;
  xp: number;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Trait → personality archetype when it's the strongest axis.
const TYPE_BY_TRAIT: Record<TraitKey, string> = {
  consistency: "type.steady",
  discipline: "type.disciplined",
  variety: "type.explorer",
  dedication: "type.devoted",
  momentum: "type.sprinter",
};

export const TRAIT_ORDER: TraitKey[] = ["consistency", "discipline", "variety", "dedication", "momentum"];

export function computeTraits(habits: TraitHabit[], opts: { isPro?: boolean } = {}): Traits {
  const profile = getProfileLevel(habits, opts);

  if (!habits.length) {
    return {
      scores: { consistency: 0, discipline: 0, variety: 0, dedication: 0, momentum: 0 },
      dominant: "consistency",
      typeKey: "type.beginner",
      level: profile.level,
      xp: profile.xp,
    };
  }

  // Consistency — average 30-day completion rate.
  const consistency = clamp01(avg(habits.map((h) => calcCompletionRate(h.logs, 30))) / 100);

  // Momentum — average 7-day completion rate (recent activity).
  const momentum = clamp01(avg(habits.map((h) => calcCompletionRate(h.logs, 7))) / 100);

  // Discipline — best current streak across habits, ~3 weeks = full bar.
  const bestCurrent = Math.max(0, ...habits.map((h) => calcStreak(h.logs).current));
  const discipline = clamp01(bestCurrent / 21);

  // Variety — unique tracked categories, capped at 5.
  const cats = new Set(habits.map((h) => h.category).filter(Boolean));
  const variety = clamp01(cats.size / 5);

  // Dedication — total completions across all habits, ~200 = full bar.
  const totalDone = habits.reduce((n, h) => n + h.logs.filter((l) => l.completed).length, 0);
  const dedication = clamp01(totalDone / 200);

  const scores: Record<TraitKey, number> = { consistency, discipline, variety, dedication, momentum };

  // Dominant trait (ties broken by TRAIT_ORDER). If everything is tiny, beginner.
  let dominant: TraitKey = "consistency";
  let max = -1;
  for (const k of TRAIT_ORDER) {
    if (scores[k] > max) { max = scores[k]; dominant = k; }
  }
  const typeKey = max < 0.12 ? "type.beginner" : TYPE_BY_TRAIT[dominant];

  return { scores, dominant, typeKey, level: profile.level, xp: profile.xp };
}

// ── Planet state (growth + living vitality) ───────────────────────────────────
//
// Structure (size, rings, moons, tree *capacity*) comes from your profile level
// and XP — it only ever goes up, so the world can never be lost. Vitality is the
// *living* layer: it rises with recent consistency, streaks and perfect days, and
// wilts when you miss days or stay away. Low vitality just makes the world look
// overgrown and faded; staying consistent again regrows everything.

export type PlanetStatus = "thriving" | "healthy" | "wilting" | "neglected";

export type PlanetState = {
  level: number;
  xp: number;
  radius: number;       // structural size (from level) — never shrinks
  hasRing: boolean;
  moons: number;
  totalTrees: number;   // tree capacity earned via XP (the max your world can hold)
  healthyTrees: number; // how many are currently green (capacity × vitality)
  vitality: number;     // 0.12..1 — the living layer
  neglectDays: number;  // days since your last check-in
  messy: number;        // 0..1 overgrowth / fog when you've been away
  lush: number;         // 0..1 greenery + colour intensity
  status: PlanetStatus;
};

export function planetState(habits: TraitHabit[], opts: { isPro?: boolean } = {}): PlanetState {
  const profile = getProfileLevel(habits, opts);
  const level = profile.level;
  const xp = profile.xp;

  const stage = Math.min(5, Math.floor((level - 1) / 2)); // lvl 1-2→0 … 11+→5
  const radius = 38 + stage * 7;                          // 38 → 73
  const hasRing = level >= 6;
  const moons = level >= 9 ? 2 : level >= 4 ? 1 : 0;
  const totalTrees = Math.min(14, Math.round(xp / 25));

  // ── recent, living signals ──────────────────────────────────────────────
  const completedDates = habits.flatMap((h) => h.logs.filter((l) => l.completed).map((l) => l.date));
  let neglectDays = 9999;
  if (completedDates.length) {
    const last = completedDates.sort()[completedDates.length - 1];
    neglectDays = Math.max(0, differenceInCalendarDays(new Date(), parseISO(last)));
  }

  const recentRate = habits.length ? avg(habits.map((h) => calcCompletionRate(h.logs, 14))) / 100 : 0;
  const bestCurrent = habits.length ? Math.max(0, ...habits.map((h) => calcStreak(h.logs).current)) : 0;
  const streakFactor = clamp01(bestCurrent / 14);

  // perfect days in the last 14: every habit completed that day
  let perfect = 0;
  if (habits.length) {
    for (let d = 0; d < 14; d++) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const key = format(day, "yyyy-MM-dd");
      if (habits.every((h) => h.logs.some((l) => l.date === key && l.completed))) perfect++;
    }
  }
  const perfectFactor = perfect / 14;

  // vitality: mostly recent consistency, plus streaks and perfect days …
  let vitality = 0.5 * recentRate + 0.3 * streakFactor + 0.2 * perfectFactor;
  // … minus a penalty for being away (kicks in after a 2-day grace window)
  if (neglectDays > 2) vitality -= Math.min(0.55, (neglectDays - 2) * 0.07);
  vitality = Math.max(0.12, clamp01(vitality)); // floored — the world never dies

  const messy = clamp01((neglectDays - 3) / 14); // overgrown/foggy the longer you're away
  const lush = clamp01(stage / 5) * (0.4 + 0.6 * vitality);
  const healthyTrees = Math.round(totalTrees * vitality);

  const status: PlanetStatus =
    vitality >= 0.75 ? "thriving" : vitality >= 0.5 ? "healthy" : vitality >= 0.3 ? "wilting" : "neglected";

  return { level, xp, radius, hasRing, moons, totalTrees, healthyTrees, vitality, neglectDays, messy, lush, status };
}
