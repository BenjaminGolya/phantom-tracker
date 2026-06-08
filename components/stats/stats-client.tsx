"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { HabitWithLogs } from "@/types";

// Lazy-load the chart (Recharts is heavy) so it loads in its own chunk after
// the page renders, instead of blocking the whole stats page.
const WeeklyChart = dynamic(() => import("./weekly-chart"), {
  ssr: false,
  loading: () => <div className="h-[140px] rounded-lg bg-surface-2 animate-pulse" />,
});
import Link from "next/link";
import { calcStreak, calcCompletionRate, getHabitLevel, getProfileLevel, PROFILE_LEVELS, LEVELS } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/plan";
import { Flame, TrendingUp, BarChart2, Award, Zap, Star, Shield, Trophy, Lock, Sparkles } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { useMounted } from "@/lib/use-mounted";
import { useT } from "@/lib/i18n/context";

interface StatsClientProps {
  habits: HabitWithLogs[];
  pro?: boolean;
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
function ProfileLevelCard({ habits, pro }: { habits: HabitWithLogs[]; pro: boolean }) {
  const t = useT();
  const info = useMemo(() => getProfileLevel(
    habits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro }
  ), [habits, pro]);

  // Tiers a free user can display are capped; Pro unlocks the full ladder.
  const visibleLevels = pro
    ? PROFILE_LEVELS
    : PROFILE_LEVELS.filter((l) => !l.pro && l.level <= PLAN_LIMITS.freeProfileLevelCap);
  const next = visibleLevels.find((l) => l.level === info.level + 1);

  // Categories counted toward diversity (capped at 5). Derived from XP (10 each).
  const cats = Math.round(info.breakdown.diversity / 10);

  const xpSources = [
    { label: t("stats.srcBase"),  value: info.breakdown.base,         icon: <Zap size={12} />,    color: "#3b82f6", hint: t("stats.srcBaseHint") },
    { label: t("stats.srcStreak"),    value: info.breakdown.streakBonus,  icon: <Flame size={12} />,  color: "#f97316", hint: t("stats.srcStreakHint") },
    { label: t("stats.srcPerfect"),      value: info.breakdown.perfectDays,  icon: <Star size={12} />,   color: "#eab308", hint: t("stats.srcPerfectHint") },
    {
      label: t("stats.srcDiversity"), value: info.breakdown.diversity, icon: <Shield size={12} />, color: "#22c55e",
      hint: cats >= 5 ? t("stats.diversityMaxed") : `${cats}/5 ${t("stats.catsWord")} · ${t("stats.addWord")} ${5 - cats} ${t("stats.moreForWord")} +${(5 - cats) * 10} XP`,
      cap: 5, used: cats,
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
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted mb-1 uppercase tracking-widest font-medium">{t("stats.profileLevel")}</p>
          <div className="flex items-center gap-2">
            <span className="text-5xl font-light leading-none" style={{ color: info.color }}>{info.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: info.color }}>{info.label}</h2>
              <p className="text-xs text-muted">{t("nav.level")} {info.level} {t("stats.of")} {visibleLevels.length}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold" style={{ color: info.color }}>{info.xp}</p>
          <p className="text-xs text-muted">{t("stats.totalXp")}</p>
          {pro && (
            <p className="text-[10px] text-primary font-medium flex items-center gap-1 justify-end mt-0.5">
              <Sparkles size={9} /> {PLAN_LIMITS.proXpMultiplier}× {t("stats.proBoost")}
            </p>
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
          {next && <span><span style={{ color: next.color }}>{next.emoji}</span> {next.label}</span>}
        </div>
        <XPProgressBar progress={info.progress} color={info.color} />
        {/* Level milestones */}
        <div className="flex justify-between mt-1">
          {visibleLevels.map((lvl) => (
            <div
              key={lvl.level}
              title={`Lv.${lvl.level} ${lvl.label}${lvl.pro ? " (Pro)" : ""}`}
              className="flex flex-col items-center gap-0.5"
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: info.level >= lvl.level ? lvl.color : "#2a2a2a",
                  boxShadow: info.level === lvl.level ? `0 0 6px ${lvl.color}` : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* XP breakdown — how you earn it + how to earn more */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-3 font-medium">{t("stats.howEarnXp")}</p>
        <div className="space-y-3">
          {xpSources.map((src) => {
            const capped = "cap" in src;
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
                <div className="flex items-end justify-between gap-3 mt-1 ml-[22px]">
                  <p className="text-[10px] text-muted leading-snug">{src.hint}</p>
                  {capped && (
                    <div className="flex gap-1 shrink-0 mb-0.5">
                      {Array.from({ length: (src as { cap: number }).cap }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-1.5 rounded-full transition-all"
                          style={{ background: i < (src as { used: number }).used ? src.color : "#2a2a2a" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Per-habit level tracker ──────────────────────────────────────────────────
function HabitLevelTracker({ habits }: { habits: HabitWithLogs[] }) {
  const t = useT();
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

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-3"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${habit.color}20`, border: `1px solid ${habit.color}40`, color: habit.color }}
                >
                  <HabitIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{habit.name}</p>
                    {/* Tier badge + level number */}
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <div
                        className="px-1.5 py-0.5 rounded-md text-xs font-mono font-bold border"
                        style={{ color: info.color, borderColor: `${info.color}40`, background: `${info.color}12` }}
                      >
                        {info.emoji}
                      </div>
                      <span className="text-xs font-mono text-muted">Lv.{info.level}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] font-medium" style={{ color: info.color }}>{info.label}</span>
                    {info.nextTierEmoji && (
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <span className="opacity-40">·</span>
                        <span>next</span>
                        <span>{info.nextTierEmoji}</span>
                        <span>{info.nextTierLabel} at Lv.{info.nextTierMinLevel}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* XP progress bar with tier milestone dots */}
              <div className="relative">
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: info.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${info.progress}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
                {/* Tier milestone dots on the bar */}
                <div className="flex justify-between mt-1.5">
                  {LEVELS.map((tier) => {
                    const reached = info.level >= tier.minLevel;
                    const isCurrent = info.level >= tier.minLevel &&
                      (LEVELS.find(t => t.minLevel > tier.minLevel)?.minLevel ?? Infinity) > info.level;
                    return (
                      <div key={tier.minLevel} className="flex flex-col items-center gap-0.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full transition-all"
                          style={{
                            backgroundColor: reached ? tier.color : "#2a2a2a",
                            boxShadow: isCurrent ? `0 0 6px ${tier.color}` : undefined,
                          }}
                        />
                        <span
                          className="text-[8px] font-bold font-mono"
                          style={{ color: reached ? tier.color : "#3a3a3a" }}
                        >
                          {tier.emoji}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-mono text-muted">
                  {info.xp} / {info.xpNext} XP
                </span>
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
}: {
  pro: boolean;
  metrics: { label: string; value: string | number; icon: React.ReactNode; hint: string }[];
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
        <div className={`grid grid-cols-2 gap-3 ${pro ? "" : "blur-sm select-none pointer-events-none"}`} aria-hidden={!pro}>
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
export function StatsClient({ habits, pro = false }: StatsClientProps) {
  const mounted = useMounted();
  const t = useT();
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), 6 - i), "EEE");
      const count = habits.reduce((acc, h) =>
        acc + (h.logs.some((l) => l.date === date && l.completed) ? 1 : 0), 0);
      return { date, label, count, total: habits.length };
    });
  }, [habits]);

  const totalCompletions = habits.reduce((acc, h) => acc + h.logs.filter((l) => l.completed).length, 0);
  const overallRate = habits.length
    ? Math.round(habits.reduce((acc, h) => acc + calcCompletionRate(h.logs, 30), 0) / habits.length)
    : 0;
  const allStreaks = habits.map((h) => calcStreak(h.logs));
  const topLongest = Math.max(0, ...allStreaks.map((s) => s.longest));

  // ── Advanced (Pro) metrics ──
  const profileInfo = getProfileLevel(
    habits.map((h) => ({ logs: h.logs, category: h.category })),
    { isPro: pro }
  );
  const perfectDays = Math.round(profileInfo.breakdown.perfectDays / 5);
  const activeStreakSum = allStreaks.reduce((a, s) => a + s.current, 0);
  const consistency7 = habits.length
    ? Math.round(habits.reduce((acc, h) => acc + calcCompletionRate(h.logs, 7), 0) / habits.length)
    : 0;
  const categoriesUsed = Math.round(profileInfo.breakdown.diversity / 10);

  // Date-based charts/streaks differ server vs client — render a shell until mounted.
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
          <ProfileLevelCard habits={habits} pro={pro} />

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

          {/* Weekly bar chart */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-medium mb-4">{t("stats.last7")}</h2>
            <WeeklyChart data={weekData} total={habits.length} />
          </div>

          {/* Advanced stats — Pro */}
          <AdvancedStats
            pro={pro}
            metrics={[
              { label: t("stats.perfectDays"), value: perfectDays, icon: <Star size={16} className="text-yellow-400" />, hint: t("stats.perfectDaysHint") },
              { label: t("stats.consistency7"), value: `${consistency7}%`, icon: <TrendingUp size={16} className="text-green-400" />, hint: t("stats.consistency7Hint") },
              { label: t("stats.activeStreaks"), value: `${activeStreakSum}d`, icon: <Flame size={16} className="text-orange-400" />, hint: t("stats.activeStreaksHint") },
              { label: t("stats.categoriesUsed"), value: `${categoriesUsed}/5`, icon: <Shield size={16} className="text-primary" />, hint: t("stats.categoriesUsedHint") },
            ]}
          />

          {/* Habit level tracker */}
          <HabitLevelTracker habits={habits} />
        </>
      )}
    </div>
  );
}
