"use client";

import { useState, useEffect, useRef } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, startOfYear, isSameMonth, isToday, isFuture,
  startOfISOWeek, endOfISOWeek, startOfDay, subDays,
} from "date-fns";
import { Flame, MoreHorizontal, Pencil, Trash2, Archive, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HabitWithLogs } from "@/types";
import { calcStreak, getHabitLevel } from "@/lib/utils";
import { useLang } from "@/lib/i18n/context";
import { categoryLabel } from "@/lib/i18n/category";
import { levelLabel } from "@/lib/i18n/levels";
import { dfLocale, weekdayInitials } from "@/lib/i18n/date";
import { getHabitIcon } from "@/lib/habit-icons";

export type ProgressRange = "week" | "month" | "year" | "all";

// ─── Level badge ──────────────────────────────────────────────────────────────
function LevelBadge({ logs }: { logs: { completed: boolean }[] }) {
  const info = getHabitLevel(logs);
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-mono font-medium border"
      style={{
        color: info.color,
        borderColor: `${info.color}40`,
        backgroundColor: `${info.color}12`,
      }}
      title={`${info.label} · ${info.xp} XP`}
    >
      <span className="text-[11px] font-bold leading-none tracking-tight">{info.emoji}</span>
    </div>
  );
}

// ─── XP progress bar ──────────────────────────────────────────────────────────
function XPBar({ logs, habitColor }: { logs: { completed: boolean }[]; habitColor: string }) {
  const { t, lang } = useLang();
  const info = getHabitLevel(logs) as ReturnType<typeof getHabitLevel> & {
    nextTierEmoji?: string; nextTierLabel?: string; nextTierColor?: string; nextTierMinLevel?: number;
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted flex items-center gap-1">
          <span>{info.emoji}</span>
          <span style={{ color: info.color }}>{levelLabel(info.label, lang)}</span>
          {info.nextTierEmoji && (
            <>
              <span className="opacity-30">·</span>
              <span className="opacity-50">{t("form.next")}</span>
              <span>{info.nextTierEmoji}</span>
              <span className="opacity-50">{levelLabel(info.nextTierLabel ?? "", lang)} {t("form.atLv")}{info.nextTierMinLevel}</span>
            </>
          )}
        </span>
        <span className="text-[10px] font-mono text-muted">
          {info.xp}/{info.xpNext} XP
        </span>
      </div>
      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: habitColor }}
          initial={{ width: 0 }}
          animate={{ width: `${info.progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Daily goal counter ───────────────────────────────────────────────────────
function GoalCounter({
  habit, today, onLog,
}: {
  habit: HabitWithLogs;
  today: string;
  onLog: (habitId: string, date: string, completed: boolean, value: number) => void;
}) {
  const { t } = useLang();
  const goal = habit.goal!;
  const todayLog = habit.logs.find((l) => l.date === today);
  // Fall back to the goal if the log is marked complete but has no numeric value
  // (e.g. completed via the quick-toggle button or legacy data).
  const logVal = todayLog?.value ?? (todayLog?.completed ? goal : 0);
  const [val, setVal] = useState(logVal);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = val >= goal;

  // Sync if log changes externally
  useEffect(() => {
    setVal(logVal);
  }, [logVal]);

  function commit(next: number) {
    const clamped = Math.max(0, next);
    setVal(clamped);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLog(habit.id, today, clamped >= goal, clamped);
    }, 400);
  }

  const pct = Math.min(100, Math.round((val / goal) * 100));

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted">{t("form.dailyGoal")}</span>
        <span className="text-[10px] font-mono">
          <span style={{ color: habit.color }}>{val}</span>
          <span className="text-muted">/{goal}</span>
          {done && <span style={{ color: habit.color }} className="ml-1">✓</span>}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2.5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: done ? habit.color : `${habit.color}70` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Decrement */}
        <button
          onClick={() => commit(val - 1)}
          disabled={val <= 0}
          style={{ borderColor: `${habit.color}30`, color: habit.color }}
          className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold transition-all hover:bg-surface-2 disabled:opacity-20"
        >−</button>

        {/* Input */}
        <input
          type="number"
          min={0}
          value={val}
          onChange={(e) => commit(Math.max(0, parseInt(e.target.value) || 0))}
          style={{ color: habit.color, borderColor: `${habit.color}30` }}
          className="flex-1 h-7 text-center text-xs font-mono font-bold bg-surface-2 border rounded-lg focus:outline-none focus:border-primary transition-colors"
        />

        {/* Increment */}
        <button
          onClick={() => commit(val + 1)}
          style={{ borderColor: `${habit.color}30`, color: habit.color }}
          className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold transition-all hover:bg-surface-2"
        >+</button>

        {/* Complete all */}
        {!done && (
          <button
            onClick={() => commit(goal)}
            style={{ backgroundColor: `${habit.color}18`, color: habit.color, borderColor: `${habit.color}40` }}
            className="px-2.5 h-7 rounded-lg border text-[10px] font-medium whitespace-nowrap transition-all hover:opacity-80"
          >All</button>
        )}
      </div>
    </div>
  );
}

// ─── Level-up overlay ─────────────────────────────────────────────────────────
function LevelUpFlash({ info, onDone }: { info: ReturnType<typeof getHabitLevel>; onDone: () => void }) {
  const { t, lang } = useLang();
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl pointer-events-none"
      style={{ background: `${info.color}18` }}
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-4xl font-light" style={{ color: info.color }}>{info.emoji}</span>
        <div
          className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
          style={{ color: info.color, borderColor: info.color, background: `${info.color}20` }}
        >
          {t("form.levelUp")} · Lv.{info.level}
        </div>
        <span className="text-[11px] text-white/80 mt-0.5">{levelLabel(info.label, lang)}</span>
      </motion.div>
    </motion.div>
  );
}

// ─── Calendar views ───────────────────────────────────────────────────────────
function WeekCalendar({ habit, completedSet }: { habit: HabitWithLogs; completedSet: Set<string> }) {
  const { lang } = useLang();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(today, { weekStartsOn: 0 }) });

  return (
    <div className="mt-3 grid grid-cols-7 gap-[2px]">
      {weekdayInitials(lang).map((d, i) => (
        <div key={i} className="text-center text-[8px] text-muted font-medium pb-0.5">{d}</div>
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const done = completedSet.has(key);
        const future = isFuture(day) && !isToday(day);
        const todayCell = isToday(day);
        return (
          <div
            key={key}
            title={key}
            style={{
              backgroundColor: done ? habit.color : "transparent",
              borderColor: todayCell ? habit.color : "#2a2a2a",
              boxShadow: done && todayCell ? `0 0 6px ${habit.color}80` : undefined,
              opacity: future ? 0.25 : 1,
              height: 28,
            }}
            className="rounded border flex items-center justify-center text-[9px] font-medium transition-all"
          >
            <span className={done ? "text-white" : "text-muted"}>{format(day, "d")}</span>
          </div>
        );
      })}
    </div>
  );
}

function MonthCalendar({ habit, completedSet }: { habit: HabitWithLogs; completedSet: Set<string> }) {
  const { lang } = useLang();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted font-medium">{format(today, "MMMM yyyy", { locale: dfLocale(lang) })}</p>
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {weekdayInitials(lang).map((d, i) => (
          <div key={i} className="text-center text-[8px] text-muted font-medium pb-0.5">{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const done = completedSet.has(key);
          const outside = !isSameMonth(day, today);
          const future = isFuture(day) && !isToday(day);
          const todayCell = isToday(day);
          return (
            <div
              key={key}
              title={key}
              style={{
                backgroundColor: done && !outside ? habit.color : "transparent",
                borderColor: todayCell ? habit.color : "#1f1f1f",
                opacity: outside ? 0.12 : future ? 0.25 : 1,
                boxShadow: done && todayCell ? `0 0 5px ${habit.color}70` : undefined,
                height: 22,
              }}
              className="rounded border flex items-center justify-center text-[9px] font-medium transition-all"
            >
              <span className={done && !outside ? "text-white" : "text-muted"}>{format(day, "d")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContribCalendar({ habit, completedSet, startDate }: {
  habit: HabitWithLogs; completedSet: Set<string>; startDate: Date;
}) {
  const { lang } = useLang();
  const today = new Date();
  const gridStart = startOfISOWeek(startDate);
  // Extend to end of the year so the grid is always a full rectangle
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const gridEnd = endOfISOWeek(yearEnd);
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

  const monthLabels: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    const first = week[0];
    if (first.getDate() <= 7) {
      const label = format(first, "MMM", { locale: dfLocale(lang) });
      if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label)
        monthLabels.push({ weekIdx: wi, label });
    }
  });

  const inits = weekdayInitials(lang);
  const DAYS_IDX = [1, 3, 5];
  const DAYS_SHORT = DAYS_IDX.map((i) => inits[i]);

  return (
    <div className="mt-3 overflow-x-auto">
      <div className="flex mb-0.5 pl-5">
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.weekIdx === wi);
          return (
            <div key={wi} style={{ minWidth: 10, width: 10, marginRight: 2 }}>
              {label && <span className="text-[8px] text-muted whitespace-nowrap">{label.label}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 mr-1">
          {[0,1,2,3,4,5,6].map((di) => (
            <div key={di} style={{ width: 12, height: 10 }} className="flex items-center">
              {DAYS_IDX.includes(di) && (
                <span className="text-[8px] text-muted">{DAYS_SHORT[DAYS_IDX.indexOf(di)]}</span>
              )}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const done = completedSet.has(key);
              const future = isFuture(day) && !isToday(day);
              const todayCell = isToday(day);
              const beforeStart = day < startDate;
              return (
                <div
                  key={key}
                  title={!future && !beforeStart ? `${key}${done ? " ✓" : ""}` : undefined}
                  style={{
                    width: 10, height: 10,
                    backgroundColor: beforeStart
                      ? "transparent"
                      : done
                      ? habit.color
                      : future
                      ? "#161616"
                      : "#1f1f1f",
                    outline: todayCell ? `1px solid ${habit.color}` : undefined,
                    outlineOffset: "1px",
                    opacity: beforeStart ? 0 : done ? 1 : future ? 0.5 : 0.6,
                  }}
                  className="rounded-[2px] transition-colors"
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────
export function HabitCard({ habit, range = "month", onToggleDay, onEdit, onDelete, onArchive, onCategoryClick, onMoveUp, onMoveDown }: {
  habit: HabitWithLogs;
  range?: ProgressRange;
  onToggleDay?: (habitId: string, date: string, completed: boolean, value?: number) => void;
  onEdit?: (habit: HabitWithLogs) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onCategoryClick?: (category: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}) {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmYesterday, setConfirmYesterday] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<ReturnType<typeof getHabitLevel> | null>(null);
  const prevLevelRef = useRef(getHabitLevel(habit.logs).level);

  const HabitIcon = getHabitIcon(habit.icon);
  const { current } = calcStreak(habit.logs);
  const completedSet = new Set(habit.logs.filter((l) => l.completed).map((l) => l.date));
  const today = format(new Date(), "yyyy-MM-dd");
  const doneToday = completedSet.has(today);

  // "Forgot yesterday?" nudge — show only when yesterday was a scheduled day,
  // isn't logged yet, and falls on/after the habit's creation date.
  const yDate = subDays(new Date(), 1);
  const yesterday = format(yDate, "yyyy-MM-dd");
  const yDow = format(yDate, "EEE").toLowerCase(); // mon, tue, ...
  const scheduledYesterday =
    habit.frequency === "daily" || habit.frequency.split(",").map((d) => d.trim()).includes(yDow);
  const yAfterStart = startOfDay(yDate) >= startOfDay(habit.createdAt ? new Date(habit.createdAt) : yDate);
  const showLogYesterday =
    !!onToggleDay && !habit.archived && scheduledYesterday && yAfterStart && !completedSet.has(yesterday);

  // Detect level-up when logs change
  useEffect(() => {
    const newInfo = getHabitLevel(habit.logs);
    if (newInfo.level > prevLevelRef.current) {
      setLevelUpInfo(newInfo);
    }
    prevLevelRef.current = newInfo.level;
  }, [habit.logs]);

  const yearStart = startOfYear(new Date());
  const habitStart = startOfDay(habit.createdAt ? new Date(habit.createdAt) : yearStart);
  const contribStart = range === "year" ? yearStart : habitStart;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all group overflow-hidden"
    >
      {/* Level-up flash */}
      <AnimatePresence>
        {levelUpInfo && (
          <LevelUpFlash info={levelUpInfo} onDone={() => setLevelUpInfo(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const next = !doneToday;
              // For goal habits, the quick-complete button fills the counter to
              // the goal (or clears it), so `value` and `completed` stay in sync.
              if (habit.goal) {
                onToggleDay?.(habit.id, today, next, next ? habit.goal : 0);
              } else {
                onToggleDay?.(habit.id, today, next);
              }
            }}
            style={{
              background: doneToday ? habit.color : "transparent",
              borderColor: doneToday ? habit.color : "#333",
              color: doneToday ? "white" : habit.color,
              boxShadow: doneToday ? `0 0 12px ${habit.color}60` : undefined,
            }}
            className="w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <HabitIcon size={16} />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white leading-tight">{habit.name}</h3>
            {habit.category && (
              onCategoryClick ? (
                <button
                  type="button"
                  onClick={() => onCategoryClick(habit.category!)}
                  className="text-xs text-primary hover:underline"
                >
                  {categoryLabel(habit.category, lang)}
                </button>
              ) : (
                <span className="text-xs text-primary">{categoryLabel(habit.category, lang)}</span>
              )
            )}
            {habit.description && (
              <p className="text-xs text-muted/80 mt-0.5 leading-snug line-clamp-2">{habit.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <LevelBadge logs={habit.logs} />
          {current > 0 && (
            <div className="flex items-center gap-0.5 bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-md text-xs font-mono">
              <Flame size={10} />
              {current}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Options"
              className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface-2 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                {/* Tap-outside backdrop (works on touch + mouse) */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-40 bg-surface-2 border border-border rounded-xl shadow-xl py-1">
                  <button onClick={() => { onEdit?.(habit); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-white hover:bg-surface transition-colors">
                    <Pencil size={12} /> {t("form.edit")}
                  </button>
                  {onMoveUp && (
                    <button onClick={() => { onMoveUp(habit.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-white hover:bg-surface transition-colors">
                      <ArrowUp size={12} /> {t("form.moveUp")}
                    </button>
                  )}
                  {onMoveDown && (
                    <button onClick={() => { onMoveDown(habit.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-white hover:bg-surface transition-colors">
                      <ArrowDown size={12} /> {t("form.moveDown")}
                    </button>
                  )}
                  <button onClick={() => { onArchive?.(habit.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-white hover:bg-surface transition-colors">
                    <Archive size={12} /> {habit.archived ? t("form.unarchive") : t("form.archive")}
                  </button>
                  <button onClick={() => { onDelete?.(habit.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-surface transition-colors">
                    <Trash2 size={12} /> {t("form.delete")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <XPBar logs={habit.logs} habitColor={habit.color} />

      {/* Daily goal counter */}
      {habit.goal && onToggleDay && (
        <GoalCounter habit={habit} today={today} onLog={onToggleDay} />
      )}

      {/* Forgot-yesterday nudge */}
      {showLogYesterday && (
        <button
          onClick={() => setConfirmYesterday(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/50 text-xs text-muted hover:text-primary transition-colors"
        >
          <RotateCcw size={12} /> {t("form.forgotYesterday")}
        </button>
      )}

      {/* Confirm completing yesterday */}
      {confirmYesterday && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setConfirmYesterday(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">{t("form.confirmYesterdayTitle")}</h3>
            </div>
            <p className="text-xs text-muted mb-1.5 leading-relaxed">{t("form.confirmYesterdayBody")}</p>
            <div className="flex items-center gap-2.5 mb-4">
              <span style={{ color: habit.color }}><HabitIcon size={14} /></span>
              <span className="text-sm font-medium text-white">{habit.name}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setConfirmYesterday(false)}
                className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  onToggleDay?.(habit.id, yesterday, true, habit.goal ? habit.goal : undefined);
                  setConfirmYesterday(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-dim transition-colors"
              >
                <RotateCcw size={13} /> {t("form.markDone")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {range === "week" && <WeekCalendar habit={habit} completedSet={completedSet} />}
      {range === "month" && <MonthCalendar habit={habit} completedSet={completedSet} />}
      {(range === "year" || range === "all") && (
        <ContribCalendar habit={habit} completedSet={completedSet} startDate={contribStart} />
      )}
    </motion.div>
  );
}
