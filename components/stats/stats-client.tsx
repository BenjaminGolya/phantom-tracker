"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";
import { motion } from "framer-motion";
import { HabitWithLogs } from "@/types";

// Lazy-load the chart (Recharts is heavy) so it loads in its own chunk after
// the page renders, instead of blocking the whole stats page.
const WeeklyChart = dynamic(() => import("./weekly-chart"), {
  ssr: false,
  loading: () => <div className="h-[140px] rounded-lg bg-surface-2 animate-pulse" />,
});
import Link from "next/link";
import { calcStreak, calcCompletionRate, getHabitLevel, getProfileLevel, PROFILE_LEVELS } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/plan";
import {
  Flame, TrendingUp, BarChart2, Award, Zap, Star, Shield, Trophy, Lock, Sparkles, ChevronDown, CalendarDays,
  Sparkle, Lightbulb, Sun, Cloud, Ghost, Orbit, Gem, Infinity as InfinityIcon, type LucideIcon,
} from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { useMounted } from "@/lib/use-mounted";
import { useT, useLang } from "@/lib/i18n/context";
import { levelLabel } from "@/lib/i18n/levels";
import { dfLocale } from "@/lib/i18n/date";
import { categoryLabel } from "@/lib/i18n/category";
import { CategoryIcon } from "@/components/habits/category-icon";
import { PersonalityConstellation } from "@/components/profile/personality-constellation";
import { GrowingPlanet } from "@/components/profile/growing-planet";
import { ShareProgress } from "@/components/profile/share-progress";

// Map a profile-level icon name to its lucide component.
const LEVEL_ICONS: Record<string, LucideIcon> = {
  Sparkles, Sparkle, Flame, Lightbulb, Star, Zap, Sun, Cloud, Ghost, Orbit, Gem, Infinity: InfinityIcon,
};
function levelIcon(name?: string): LucideIcon {
  return (name && LEVEL_ICONS[name]) || Sparkles;
}

interface StatsClientProps {
  habits: HabitWithLogs[];
  pro?: boolean;
  diamond?: boolean;
  seed?: number;
}

// ─── Animated XP bar ─────────────────────────────────────────────────────────
function XPProgressBar({ progress, color, delay = 0 }: { progress: number; color: string; delay?: number }) {
  return (
    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Profile level hero card ──────────────────────────────────────────────────
function ProfileLevelCard({ habits, pro, diamond }: { habits: HabitWithLogs[]; pro: boolean; diamond: boolean }) {
  const { t, lang } = useLang();
  const info = useMemo(() => getProfileLevel(
    habits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro, isDiamond: diamond }
  ), [habits, pro, diamond]);

  // Free tiers are capped; Pro unlocks the full ladder; the Diamond summit
  // (Singularity) only shows for Diamond.
  const visibleLevels = PROFILE_LEVELS.filter((l) => {
    if (l.diamond && !diamond) return false;
    if (!pro && (l.pro || l.level > PLAN_LIMITS.freeProfileLevelCap)) return false;
    return true;
  });
  const next = visibleLevels.find((l) => l.level === info.level + 1);

  // Unique categories used (each adds +10 XP, uncapped).
  const cats = Math.round(info.breakdown.diversity / 10);

  const xpSources = [
    { label: t("stats.srcBase"),  value: info.breakdown.base,         icon: <Zap size={12} />,    color: "#3b82f6", hint: t("stats.srcBaseHint") },
    { label: t("stats.srcStreak"),    value: info.breakdown.streakBonus,  icon: <Flame size={12} />,  color: "#f97316", hint: t("stats.srcStreakHint") },
    { label: t("stats.srcPerfect"),      value: info.breakdown.perfectDays,  icon: <Star size={12} />,   color: "#eab308", hint: t("stats.srcPerfectHint") },
    {
      label: t("stats.srcDiversity"), value: info.breakdown.diversity, icon: <Shield size={12} />, color: "#22c55e",
      hint: `${cats} ${t("stats.catsWord")} · ${t("stats.catEachXp")}`,
    },
    { label: t("stats.srcMastery"),     value: info.breakdown.masteryBonus, icon: <Trophy size={12} />, color: "#a855f7", hint: t("stats.srcMasteryHint") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-surface border border-border rounded-2xl p-5"
      style={{ borderColor: `${info.color}30` }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: info.color }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Modern level medallion */}
          {(() => {
            const Icon = levelIcon(info.icon);
            return (
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(140deg, ${info.color}33, ${info.color}0d)`,
                  border: `1px solid ${info.color}55`,
                  boxShadow: `0 0 26px ${info.color}33, inset 0 0 16px ${info.color}1a`,
                }}
              >
                <Icon size={28} style={{ color: info.color }} strokeWidth={1.75} />
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none text-white border border-background"
                  style={{ backgroundColor: info.color }}
                >
                  {t("nav.level")} {info.level}
                </span>
              </div>
            );
          })()}
          <div className="min-w-0">
            <p className="text-[10px] text-muted mb-0.5 uppercase tracking-widest font-medium">{t("stats.profileLevel")}</p>
            <h2 className="text-2xl font-bold leading-tight truncate" style={{ color: info.color }}>{levelLabel(info.label, lang)}</h2>
            <p className="text-xs text-muted">{t("nav.level")} {info.level} {t("stats.of")} {visibleLevels.length}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-mono font-bold" style={{ color: info.color }}>{info.xp}</p>
          <p className="text-xs text-muted">{t("stats.totalXp")}</p>
          {pro && (
            diamond ? (
              <p className="text-[10px] font-medium flex items-center gap-1 justify-end mt-0.5" style={{ color: "#67e8f9" }}>
                <Gem size={9} /> {PLAN_LIMITS.diamondXpMultiplier}× {t("stats.diamondBoost")}
              </p>
            ) : (
              <p className="text-[10px] text-primary font-medium flex items-center gap-1 justify-end mt-0.5">
                <Sparkles size={9} /> {PLAN_LIMITS.proXpMultiplier}× {t("stats.proBoost")}
              </p>
            )
          )}
        </div>
      </div>

      {/* Free cap notice */}
      {info.capped && (
        <Link
          href="/pricing"
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-colors"
        >
          <Lock size={13} className="text-primary shrink-0" />
          <span className="text-[11px] text-muted">
            {t("stats.cappedPre")} <span className="text-primary font-medium">{t("habits.goPro")}</span> {t("stats.cappedPost")}
          </span>
        </Link>
      )}

      {/* XP bar to next level */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>{info.isMax ? t("stats.maxLevel") : `${info.xp - info.xpRequired} / ${info.xpNext - info.xpRequired} ${t("stats.xpToNext")}`}</span>
          {next && (() => {
            const NI = levelIcon(next.icon);
            return (
              <span className="flex items-center gap-1" style={{ color: next.color }}>
                <NI size={12} strokeWidth={2} /> {levelLabel(next.label, lang)}
              </span>
            );
          })()}
        </div>
        <XPProgressBar progress={info.progress} color={info.color} />
        {/* Level milestones */}
        <div className="flex justify-between mt-1.5">
          {visibleLevels.map((lvl) => {
            const reached = info.level >= lvl.level;
            const isCurrent = info.level === lvl.level;
            return (
              <div
                key={lvl.level}
                title={`Lv.${lvl.level} ${levelLabel(lvl.label, lang)}${lvl.pro ? " (Pro)" : ""}`}
                className="rounded-full transition-all"
                style={{
                  width: isCurrent ? 9 : 6,
                  height: isCurrent ? 9 : 6,
                  backgroundColor: reached ? lvl.color : "#2a2a2a",
                  boxShadow: isCurrent ? `0 0 8px ${lvl.color}` : undefined,
                  border: isCurrent ? `2px solid ${lvl.color}` : undefined,
                  outline: isCurrent ? "2px solid var(--background, #0a0a0a)" : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* XP breakdown - how you earn it + how to earn more (collapsible) */}
      <details className="group border-t border-border pt-4">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none group/sum">
          <span className="text-xs text-muted uppercase tracking-wider font-medium transition-colors group-hover/sum:text-primary">{t("stats.howEarnXp")}</span>
          <ChevronDown size={15} className="text-muted transition-all group-open:rotate-180 group-hover/sum:text-primary" />
        </summary>
        <div className="space-y-3 mt-3">
          {xpSources.map((src) => {
            return (
              <div key={src.label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5" style={{ color: src.color }}>
                    {src.icon}
                    <span className="text-xs text-white">{src.label}</span>
                  </div>
                  <span
                    className="text-xs font-mono font-medium"
                    style={{ color: src.value > 0 ? src.color : "#52525b" }}
                  >
                    +{src.value} XP
                  </span>
                </div>
                <div className="mt-1 ml-[22px]">
                  <p className="text-[10px] text-muted leading-snug">{src.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </motion.div>
  );
}

// ─── Per-habit level tracker ──────────────────────────────────────────────────
function HabitLevelTracker({ habits }: { habits: HabitWithLogs[] }) {
  const { t, lang } = useLang();
  const sorted = [...habits].sort((a, b) => {
    const la = getHabitLevel(a.logs);
    const lb = getHabitLevel(b.logs);
    return lb.xp - la.xp;
  });

  return (
    <div>
      <h2 className="text-sm font-medium mb-3">{t("stats.habitLevels")}</h2>
      <div className="space-y-2">
        {sorted.map((habit, i) => {
          const info = getHabitLevel(habit.logs) as ReturnType<typeof getHabitLevel> & {
            nextTierEmoji?: string; nextTierLabel?: string; nextTierColor?: string; nextTierMinLevel?: number;
          };
          const HabitIcon = getHabitIcon(habit.icon);
          const intoLevel = info.xp - info.xpRequired;
          const levelSpan = info.xpNext - info.xpRequired;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-3.5"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(140deg, ${habit.color}33, ${habit.color}0d)`,
                    border: `1px solid ${habit.color}40`,
                    color: habit.color,
                  }}
                >
                  <HabitIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{habit.name}</p>
                  <p className="text-[11px] flex items-center gap-1 mt-0.5">
                    <span>{info.emoji}</span>
                    <span className="font-medium" style={{ color: info.color }}>{levelLabel(info.label, lang)}</span>
                  </p>
                </div>
                <span
                  className="shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold border"
                  style={{ color: info.color, borderColor: `${info.color}40`, background: `${info.color}12` }}
                >
                  {t("nav.level")} {info.level}
                </span>
              </div>

              {/* Progress to next level */}
              <div className="mt-3">
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: info.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${info.progress}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    {t("form.next")}: {t("nav.level")} {info.level + 1}
                    {info.nextTierEmoji && (
                      <>
                        <span className="opacity-40">·</span>
                        <span>{info.nextTierEmoji}</span>
                        <span>{levelLabel(info.nextTierLabel ?? "", lang)}</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono">{intoLevel} / {levelSpan} XP</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Advanced stats (Pro-gated) ───────────────────────────────────────────────
function AdvancedStats({
  pro,
  metrics,
  children,
}: {
  pro: boolean;
  metrics: { label: string; value: string | number; icon: React.ReactNode; hint: string }[];
  children?: React.ReactNode;
}) {
  const t = useT();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-1.5">
          {t("stats.advanced")}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
            <Sparkles size={9} /> PRO
          </span>
        </h2>
      </div>

      <div className="relative">
        <div className={`space-y-3 ${pro ? "" : "blur-sm select-none pointer-events-none"}`} aria-hidden={!pro}>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(({ label, value, icon, hint }) => (
              <div key={label} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">{label}</span>
                  {icon}
                </div>
                <div className="text-2xl font-mono font-bold">{value}</div>
                <p className="text-[10px] text-muted mt-1">{hint}</p>
              </div>
            ))}
          </div>
          {children}
        </div>

        {!pro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-2">
              <Lock size={18} className="text-primary" />
            </div>
            <p className="text-sm font-medium mb-0.5">{t("stats.unlockTitle")}</p>
            <p className="text-xs text-muted mb-3">{t("stats.unlockSub")}</p>
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dim text-white text-xs font-medium rounded-lg transition-all hover:shadow-glow"
            >
              <Sparkles size={13} /> {t("stats.upgradePro")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main stats page ──────────────────────────────────────────────────────────
export function StatsClient({ habits, pro = false, diamond = false, seed = 1 }: StatsClientProps) {
  const mounted = useMounted();
  const { t, lang } = useLang();
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), 6 - i), "EEE", { locale: dfLocale(lang) });
      const count = habits.reduce((acc, h) =>
        acc + (h.logs.some((l) => l.date === date && l.completed) ? 1 : 0), 0);
      return { date, label, count, total: habits.length };
    });
  }, [habits, lang]);

  const totalCompletions = habits.reduce((acc, h) => acc + h.logs.filter((l) => l.completed).length, 0);
  const overallRate = habits.length
    ? Math.round(habits.reduce((acc, h) => acc + calcCompletionRate(h.logs, 30), 0) / habits.length)
    : 0;
  const allStreaks = habits.map((h) => calcStreak(h.logs));
  const topLongest = Math.max(0, ...allStreaks.map((s) => s.longest));
  const bestCurrent = Math.max(0, ...allStreaks.map((s) => s.current));

  // ── Advanced (Pro) metrics ──
  const profileInfo = getProfileLevel(
    habits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro, isDiamond: diamond }
  );
  const perfectDays = Math.round(profileInfo.breakdown.perfectDays / 5);
  const activeStreakSum = allStreaks.reduce((a, s) => a + s.current, 0);
  const consistency7 = habits.length
    ? Math.round(habits.reduce((acc, h) => acc + calcCompletionRate(h.logs, 7), 0) / habits.length)
    : 0;
  const categoriesUsed = Math.round(profileInfo.breakdown.diversity / 10);

  // ── More advanced (Pro) metrics ──
  const completedDates = habits.flatMap((h) => h.logs.filter((l) => l.completed).map((l) => l.date));
  const activeDays = new Set(completedDates).size;

  // 30-day momentum: this month's volume vs the previous 30 days.
  const inWindow = (d: string, fromAgo: number, toAgo: number) => {
    const dt = parseISO(d);
    return dt > subDays(new Date(), fromAgo) && dt <= subDays(new Date(), toAgo);
  };
  const last30 = completedDates.filter((d) => inWindow(d, 30, 0)).length;
  const prev30 = completedDates.filter((d) => inWindow(d, 60, 30)).length;
  const trendPct = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : last30 > 0 ? 100 : 0;
  // Average over the days actually tracked (since the oldest habit was created),
  // capped at 30 - so a brand-new account isn't divided by a full month.
  const oldestCreatedAt = habits.reduce<Date | null>((min, h) => {
    const c = new Date(h.createdAt);
    return !min || c < min ? c : min;
  }, null);
  const daysTracked = oldestCreatedAt
    ? Math.min(30, Math.max(1, differenceInCalendarDays(new Date(), oldestCreatedAt) + 1))
    : 1;
  const avgPerDay = (last30 / daysTracked).toFixed(1);

  // Day-of-week distribution (0 = Sunday) across all completions.
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of completedDates) weekdayCounts[parseISO(d).getDay()]++;
  const maxWeekday = Math.max(1, ...weekdayCounts);
  const busiestIdx = completedDates.length ? weekdayCounts.indexOf(Math.max(...weekdayCounts)) : -1;
  const busiestDay = busiestIdx >= 0
    ? format(new Date(2023, 0, 1 + busiestIdx), "EEE", { locale: dfLocale(lang) })
    : "-";

  // Completions per category (top 6).
  const catTotals = new Map<string, number>();
  for (const h of habits) {
    const done = h.logs.filter((l) => l.completed).length;
    if (!done) continue;
    const key = h.category || "__none";
    catTotals.set(key, (catTotals.get(key) ?? 0) + done);
  }
  const catRows = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const catMax = Math.max(1, ...catRows.map(([, v]) => v));

  // Date-based charts/streaks differ server vs client - render a shell until mounted.
  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-28 lg:pb-6">
        <h1 className="text-lg font-semibold">{t("nav.stats")}</h1>
        <div className="h-48 bg-surface border border-border rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 lg:pb-6">
      <h1 className="text-lg font-semibold">Stats</h1>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-sm text-muted">{t("stats.noData")}</p>
        </div>
      ) : (
        <>
          {/* Profile level hero */}
          <ProfileLevelCard habits={habits} pro={pro} diamond={diamond} />

          {/* Profile portrait - growing world + personality */}
          <GrowingPlanet habits={habits} pro={pro} diamond={diamond} seed={seed} />
          <PersonalityConstellation habits={habits} pro={pro} />

          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("stats.totalCompletions"), value: totalCompletions, icon: <BarChart2 size={16} className="text-primary" /> },
              { label: t("stats.rate30"),        value: `${overallRate}%`, icon: <TrendingUp size={16} className="text-green-400" /> },
              { label: t("stats.bestStreakEver"),   value: `${topLongest}d`, icon: <Flame size={16} className="text-orange-400" /> },
              { label: t("stats.habitsTracked"),     value: habits.length,    icon: <Award size={16} className="text-primary" /> },
            ].map(({ label, value, icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">{label}</span>
                  {icon}
                </div>
                <div className="text-2xl font-mono font-bold">{value}</div>
              </motion.div>
            ))}
          </div>

          {/* Share progress */}
          <ShareProgress
            streak={bestCurrent}
            completions={totalCompletions}
            rate={overallRate}
            level={profileInfo.label}
          />

          {/* Weekly bar chart */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-medium mb-4">{t("stats.last7")}</h2>
            <WeeklyChart data={weekData} total={habits.length} />
          </div>

          {/* Advanced stats - Pro */}
          <AdvancedStats
            pro={pro}
            metrics={[
              { label: t("stats.perfectDays"), value: perfectDays, icon: <Star size={16} className="text-yellow-400" />, hint: t("stats.perfectDaysHint") },
              { label: t("stats.consistency7"), value: `${consistency7}%`, icon: <TrendingUp size={16} className="text-green-400" />, hint: t("stats.consistency7Hint") },
              { label: t("stats.activeStreaks"), value: `${activeStreakSum}d`, icon: <Flame size={16} className="text-orange-400" />, hint: t("stats.activeStreaksHint") },
              { label: t("stats.categoriesUsed"), value: `${categoriesUsed}`, icon: <Shield size={16} className="text-primary" />, hint: t("stats.categoriesUsedHint") },
              { label: t("stats.trend30"), value: `${trendPct >= 0 ? "+" : ""}${trendPct}%`, icon: <TrendingUp size={16} className={trendPct >= 0 ? "text-green-400" : "text-red-400"} />, hint: t("stats.trend30Hint") },
              { label: t("stats.dailyAvg"), value: avgPerDay, icon: <BarChart2 size={16} className="text-primary" />, hint: t("stats.dailyAvgHint") },
              { label: t("stats.busiestDay"), value: busiestDay, icon: <CalendarDays size={16} className="text-sky-400" />, hint: t("stats.busiestDayHint") },
              { label: t("stats.activeDays"), value: activeDays, icon: <Award size={16} className="text-yellow-400" />, hint: t("stats.activeDaysHint") },
            ]}
          >
            {/* Day-of-week distribution */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-muted mb-3">{t("stats.byWeekday")}</h3>
              <div className="flex items-stretch justify-between gap-1.5 h-24">
                {weekdayCounts.map((c, i) => {
                  const isBusiest = i === busiestIdx && c > 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                      <span className={`text-[10px] font-mono tabular-nums ${isBusiest ? "text-primary font-semibold" : c > 0 ? "text-white/70" : "text-muted/50"}`}>
                        {c}
                      </span>
                      <div className="w-full flex-1 flex items-end">
                        <motion.div
                          className="w-full rounded-t-md"
                          style={{ background: isBusiest ? "#7f49c3" : "#7f49c355" }}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.round((c / maxWeekday) * 100)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.04 }}
                        />
                      </div>
                      <span className="text-[9px] text-muted">
                        {format(new Date(2023, 0, 1 + i), "EEEEE", { locale: dfLocale(lang) })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completions by category */}
            {catRows.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="text-xs font-medium text-muted mb-3">{t("stats.byCategory")}</h3>
                <div className="space-y-2">
                  {catRows.map(([key, v], i) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-white/80 inline-flex items-center gap-1">{key === "__none" ? t("stats.noCategory") : <><CategoryIcon label={key} /> {categoryLabel(key, lang)}</>}</span>
                        <span className="font-mono text-muted">{v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((v / catMax) * 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AdvancedStats>

          {/* Habit level tracker */}
          <HabitLevelTracker habits={habits} />
        </>
      )}
    </div>
  );
}
