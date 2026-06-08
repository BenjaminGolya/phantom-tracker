"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { HabitWithLogs } from "@/types";
import { useT } from "@/lib/i18n/context";

interface TodayChecklistProps {
  habits: HabitWithLogs[];
  onToggle: (habitId: string, date: string, completed: boolean, value?: number) => void;
}

// ─── Goal row (for habits with a numeric goal) ────────────────────────────────
function GoalRow({ habit, today, onToggle }: {
  habit: HabitWithLogs;
  today: string;
  onToggle: TodayChecklistProps["onToggle"];
}) {
  const t = useT();
  const goal = habit.goal!;
  const todayLog = habit.logs.find((l) => l.date === today);
  // Fall back to the goal if the log is complete but has no numeric value
  // (e.g. completed via the quick-toggle button or legacy data).
  const logVal = todayLog?.value ?? (todayLog?.completed ? goal : 0);
  const [val, setVal] = useState(logVal);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = val >= goal;

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
          {habit.category && <p className="text-xs text-muted">{habit.category}</p>}
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
        {!done && (
          <button
            onClick={() => commit(goal)}
            style={{ backgroundColor: `${habit.color}15`, color: habit.color, borderColor: `${habit.color}40` }}
            className="px-2.5 h-7 rounded-lg border text-[10px] font-medium whitespace-nowrap hover:opacity-80 transition-all"
          >{t("dash.all")}</button>
        )}
        {done && <span style={{ color: habit.color }} className="text-xs font-medium pl-1">{t("dash.doneMark")}</span>}
      </div>
    </motion.div>
  );
}

// ─── Main checklist ───────────────────────────────────────────────────────────
export function TodayChecklist({ habits, onToggle }: TodayChecklistProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const t = useT();

  return (
    <div>
      <h2 className="text-sm font-medium text-muted mb-3">{t("dash.todaysHabits")}</h2>
      <div className="space-y-2">
        {habits.map((habit, i) => {
          // Habits with a numeric goal get the counter UI
          if (habit.goal) {
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GoalRow habit={habit} today={today} onToggle={onToggle} />
              </motion.div>
            );
          }

          // Regular habits — simple toggle
          const done = habit.logs.some((l) => l.date === today && l.completed);
          const HabitIcon = getHabitIcon(habit.icon);
          return (
            <motion.button
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onToggle(habit.id, today, !done)}
              className="w-full flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary/30 transition-all text-left group"
            >
              <div
                style={{
                  background: done ? habit.color : `${habit.color}12`,
                  borderColor: done ? habit.color : `${habit.color}40`,
                  boxShadow: done ? `0 0 10px ${habit.color}50` : undefined,
                }}
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
              >
                {done
                  ? <Check size={14} className="text-white" />
                  : <HabitIcon size={14} style={{ color: habit.color }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${done ? "line-through text-muted" : "text-white"}`}>
                  {habit.name}
                </p>
                {habit.category && <p className="text-xs text-muted">{habit.category}</p>}
              </div>
              {done && <span className="text-xs text-primary font-medium shrink-0">{t("dash.doneMark")}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
