"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Check, RotateCcw, Snowflake, CalendarClock } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { HabitWithLogs } from "@/types";
import { isScheduledOn, nextDueDates } from "@/lib/utils";
import { useLang } from "@/lib/i18n/context";
import { dfLocale } from "@/lib/i18n/date";
import { categoryLabel } from "@/lib/i18n/category";
import { CategoryFilter, usedCategories } from "@/components/habits/category-filter";

interface TodayChecklistProps {
  habits: HabitWithLogs[];
  onToggle: (habitId: string, date: string, completed: boolean, value?: number) => void;
  onFreeze: (habitId: string, date: string, frozen: boolean) => void;
}

// ─── Goal row (for habits with a numeric goal) ────────────────────────────────
function GoalRow({ habit, today, onToggle, onFreeze }: {
  habit: HabitWithLogs;
  today: string;
  onToggle: TodayChecklistProps["onToggle"];
  onFreeze: TodayChecklistProps["onFreeze"];
}) {
  const { t, lang } = useLang();
  const goal = habit.goal!;
  const todayLog = habit.logs.find((l) => l.date === today);
  // Fall back to the goal if the log is complete but has no numeric value
  // (e.g. completed via the quick-toggle button or legacy data).
  const logVal = todayLog?.value ?? (todayLog?.completed ? goal : 0);
  const [val, setVal] = useState(logVal);
  const [confirm, setConfirm] = useState<null | "all" | "reset">(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = val >= goal;
  const frozenToday = !!todayLog?.frozen && !done;

  useEffect(() => { setVal(logVal); }, [logVal]);

  function commit(next: number) {
    const clamped = Math.max(0, next);
    setVal(clamped);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onToggle(habit.id, today, clamped >= goal, clamped);
    }, 400);
  }

  const HabitIcon = getHabitIcon(habit.icon);
  const pct = Math.min(100, Math.round((val / goal) * 100));

  return (
    <motion.div
      className="p-3 bg-surface border rounded-xl transition-all"
      style={{ borderColor: done ? `${habit.color}50` : undefined }}
    >
      {/* Top row */}
      <div className="flex items-center gap-3 mb-2">
        <div
          style={{
            background: done ? habit.color : `${habit.color}12`,
            borderColor: done ? habit.color : `${habit.color}40`,
            boxShadow: done ? `0 0 10px ${habit.color}50` : undefined,
          }}
          className="w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all"
        >
          {done
            ? <Check size={14} className="text-white" />
            : <HabitIcon size={14} style={{ color: habit.color }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${done ? "line-through text-muted" : "text-white"}`}>{habit.name}</p>
          {habit.category && <p className="text-xs text-muted">{categoryLabel(habit.category, lang)}</p>}
        </div>
        <span className="text-xs font-mono shrink-0">
          <span style={{ color: habit.color }}>{val}</span>
          <span className="text-muted">/{goal}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-2 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: done ? habit.color : `${habit.color}60` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => commit(val - 1)}
          disabled={val <= 0}
          style={{ borderColor: `${habit.color}30`, color: habit.color }}
          className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-surface-2 disabled:opacity-20 transition-all"
        >−</button>
        <input
          type="number"
          min={0}
          value={val}
          onChange={(e) => commit(Math.max(0, parseInt(e.target.value) || 0))}
          style={{ color: habit.color, borderColor: `${habit.color}30` }}
          className="flex-1 h-7 text-center text-xs font-mono font-bold bg-surface-2 border rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => commit(val + 1)}
          style={{ borderColor: `${habit.color}30`, color: habit.color }}
          className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-surface-2 transition-all"
        >+</button>
        {val > 0 && (
          <button
            onClick={() => setConfirm("reset")}
            title={t("dash.reset")}
            className="w-7 h-7 rounded-lg border border-border text-muted flex items-center justify-center hover:text-white hover:bg-surface-2 transition-all"
          ><RotateCcw size={13} /></button>
        )}
        {!done && (
          <button
            onClick={() => setConfirm("all")}
            style={{ backgroundColor: `${habit.color}15`, color: habit.color, borderColor: `${habit.color}40` }}
            className="px-2.5 h-7 rounded-lg border text-[10px] font-medium whitespace-nowrap hover:opacity-80 transition-all"
          >{t("dash.all")}</button>
        )}
        {!done && val === 0 && (
          <button
            onClick={() => onFreeze(habit.id, today, !frozenToday)}
            title={t("dash.freeze")}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              frozenToday ? "border-sky-400/50 text-sky-400 bg-sky-400/10" : "border-border text-muted hover:text-sky-400 hover:border-sky-400/40"
            }`}
          ><Snowflake size={13} /></button>
        )}
        {done && <span style={{ color: habit.color }} className="text-xs font-medium pl-1">{t("dash.doneMark")}</span>}
        {frozenToday && <span className="text-[11px] text-sky-400 font-medium pl-1">{t("dash.restDay")}</span>}
      </div>

      {/* Confirmation modal for All / Reset */}
      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-1.5">
              {confirm === "all" ? t("dash.confirmAllTitle") : t("dash.confirmResetTitle")}
            </h3>
            <p className="text-xs text-muted mb-1.5 leading-relaxed">
              {confirm === "all" ? t("dash.confirmAllBody") : t("dash.confirmResetBody")}
            </p>
            <div className="flex items-center gap-2.5 mb-4">
              <span style={{ color: habit.color }}><HabitIcon size={14} /></span>
              <span className="text-sm font-medium text-white">{habit.name}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors"
              >{t("common.cancel")}</button>
              <button
                onClick={() => { commit(confirm === "all" ? goal : 0); setConfirm(null); }}
                style={{ backgroundColor: habit.color }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {confirm === "all" ? <Check size={13} /> : <RotateCcw size={13} />}
                {t("dash.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main checklist ───────────────────────────────────────────────────────────
export function TodayChecklist({ habits, onToggle, onFreeze }: TodayChecklistProps) {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const { t, lang } = useLang();
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const categories = usedCategories(habits);
  const filtered = catFilter ? habits.filter((h) => h.category === catFilter) : habits;

  // Only habits actually scheduled for today belong in the checklist. Weekly /
  // monthly habits that aren't due today move to a muted "Coming up" list so
  // it's clear when they next need doing — without cluttering today.
  const shown = filtered.filter((h) => isScheduledOn(h.frequency, now));
  const upcoming = filtered
    .filter((h) => !isScheduledOn(h.frequency, now))
    .map((h) => ({ habit: h, dues: nextDueDates(h.frequency, now, 3) }))
    .filter((u) => u.dues.length > 0)
    .sort((a, b) => a.dues[0].getTime() - b.dues[0].getTime());

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-medium text-muted">{t("dash.todaysHabits")}</h2>
        <CategoryFilter categories={categories} value={catFilter} onChange={setCatFilter} />
      </div>
      {shown.length === 0 && (
        <div className="flex items-center gap-2.5 p-4 bg-surface border border-border rounded-xl text-sm text-muted">
          <Check size={15} className="text-green-400 shrink-0" />
          {t("dash.noneToday")}
        </div>
      )}
      <div className="space-y-2">
        {shown.map((habit, i) => {
          // Habits with a numeric goal get the counter UI
          if (habit.goal) {
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GoalRow habit={habit} today={today} onToggle={onToggle} onFreeze={onFreeze} />
              </motion.div>
            );
          }

          // Regular habits — simple toggle
          const todayLog = habit.logs.find((l) => l.date === today);
          const done = !!todayLog?.completed;
          const frozenToday = !!todayLog?.frozen && !done;
          const HabitIcon = getHabitIcon(habit.icon);
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="w-full flex items-center gap-2 p-3 bg-surface border border-border rounded-xl transition-all"
              style={{ borderColor: done ? `${habit.color}50` : frozenToday ? "#38bdf850" : undefined }}
            >
              {/* Status icon (display only) */}
              <div
                style={{
                  background: done ? habit.color : frozenToday ? "#38bdf820" : `${habit.color}12`,
                  borderColor: done ? habit.color : frozenToday ? "#38bdf870" : `${habit.color}40`,
                  boxShadow: done ? `0 0 10px ${habit.color}50` : undefined,
                }}
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
              >
                {done ? (
                  <Check size={14} className="text-white" />
                ) : frozenToday ? (
                  <Snowflake size={14} className="text-sky-400" />
                ) : (
                  <HabitIcon size={14} style={{ color: habit.color }} />
                )}
              </div>

              {/* Name + category (display only — completing happens via the button) */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${done || frozenToday ? "line-through text-muted" : "text-white"}`}>
                  {habit.name}
                </p>
                {habit.category && <p className="text-xs text-muted">{categoryLabel(habit.category, lang)}</p>}
              </div>

              {/* Actions */}
              {done ? (
                // Completed → allow undo (redo by completing again afterwards)
                <button
                  onClick={() => onToggle(habit.id, today, false)}
                  title={t("dash.undo")}
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-border text-xs font-medium text-muted hover:text-white hover:border-primary/40 shrink-0 transition-all"
                >
                  <RotateCcw size={13} /> {t("dash.undo")}
                </button>
              ) : frozenToday ? (
                // Resting → allow undo of the rest day
                <button
                  onClick={() => onFreeze(habit.id, today, false)}
                  title={t("dash.undo")}
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-sky-400/40 text-xs font-medium text-sky-400 hover:bg-sky-400/10 shrink-0 transition-all"
                >
                  <RotateCcw size={13} /> {t("dash.undo")}
                </button>
              ) : (
                <>
                  {/* Rest day (snowflake) — protects the streak */}
                  <button
                    onClick={() => onFreeze(habit.id, today, true)}
                    title={t("dash.freeze")}
                    aria-label={t("dash.rest")}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted hover:text-sky-400 hover:border-sky-400/40 shrink-0 transition-all"
                  >
                    <Snowflake size={14} />
                  </button>
                  {/* Complete (checkmark) */}
                  <button
                    onClick={() => onToggle(habit.id, today, true)}
                    title={t("dash.complete")}
                    aria-label={t("dash.complete")}
                    style={{ backgroundColor: habit.color }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0 transition-all hover:opacity-90 active:scale-95"
                  >
                    <Check size={15} />
                  </button>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Coming up — weekly/monthly habits not due today, with their next date */}
      {upcoming.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
            <CalendarClock size={13} /> {t("dash.comingUp")}
          </h3>
          <div className="space-y-1.5">
            {upcoming.map(({ habit, dues }) => {
              const HabitIcon = getHabitIcon(habit.icon);
              const tomorrowKey = format(new Date(now.getTime() + 86400000), "yyyy-MM-dd");
              const doneToday = habit.logs.some((l) => l.date === today && l.completed);
              const fmtDue = (d: Date) =>
                format(d, "yyyy-MM-dd") === tomorrowKey ? t("dash.tomorrow") : format(d, "EEE, MMM d", { locale: dfLocale(lang) });
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 px-3 py-2 bg-surface/60 border border-border rounded-xl"
                >
                  {/* Status icon (display only) */}
                  <div
                    style={{
                      background: doneToday ? habit.color : `${habit.color}12`,
                      borderColor: doneToday ? habit.color : `${habit.color}40`,
                      boxShadow: doneToday ? `0 0 8px ${habit.color}50` : undefined,
                    }}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all"
                  >
                    {doneToday ? <Check size={14} className="text-white" /> : <HabitIcon size={14} style={{ color: habit.color }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${doneToday ? "line-through text-muted" : "text-white/90"}`}>{habit.name}</p>
                    {/* Upcoming due dates — only the next (selected) date is highlighted */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {dues.map((d, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            idx === 0
                              ? "bg-primary text-white font-medium"
                              : "bg-surface-2 text-muted"
                          }`}
                        >
                          {fmtDue(d)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Complete today (or undo), even though it's not due today */}
                  {doneToday ? (
                    <button
                      onClick={() => onToggle(habit.id, today, false, habit.goal ? 0 : undefined)}
                      title={t("dash.undo")}
                      className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-border text-xs font-medium text-muted hover:text-white hover:border-primary/40 shrink-0 transition-all"
                    >
                      <RotateCcw size={13} /> {t("dash.undo")}
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggle(habit.id, today, true, habit.goal ? habit.goal : undefined)}
                      title={t("dash.completeToday")}
                      style={{ backgroundColor: habit.color }}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white shrink-0 transition-all hover:opacity-90 active:scale-95"
                    >
                      <Check size={14} /> {t("dash.complete")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
