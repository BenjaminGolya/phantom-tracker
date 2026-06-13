"use client";

import { useMemo } from "react";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { getYearDays } from "@/lib/utils";
import { HabitWithLogs } from "@/types";
import { useLang } from "@/lib/i18n/context";
import { dfLocale } from "@/lib/i18n/date";

interface HabitGridProps {
  habit: HabitWithLogs;
  year?: number;
  onToggle?: (habitId: string, date: string, completed: boolean) => void;
}

const CELL = 11; // square size in px
const ROW_OFFSET = 16; // height of the month-label row + its margin

// Opacity ramp for completion intensity (level 1..4). Level 4 = goal fully met.
const OPACITY = [0, 0.3, 0.52, 0.74, 1];

export function HabitGrid({ habit, year, onToggle }: HabitGridProps) {
  const { lang } = useLang();
  const currentYear = year ?? new Date().getFullYear();
  const days = useMemo(() => getYearDays(currentYear), [currentYear]);

  // date → log, so we can shade by how much of the goal was met that day.
  const logByDate = useMemo(() => {
    const m = new Map<string, { completed: boolean; frozen: boolean; value: number | null }>();
    for (const l of habit.logs) {
      m.set(l.date, { completed: l.completed, frozen: !!l.frozen, value: l.value ?? null });
    }
    return m;
  }, [habit.logs]);

  const today = startOfDay(new Date());
  const todayKey = format(today, "yyyy-MM-dd");

  // Group days into week-columns (Sunday-padded), GitHub-style.
  const weeks: string[][] = [];
  let week: string[] = [];
  const firstDayOfWeek = parseISO(days[0]).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) week.push("");
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push("");
    weeks.push(week);
  }

  // Backfill window: only today and yesterday are editable.
  const editFloor = startOfDay(new Date());
  editFloor.setDate(editFloor.getDate() - 1);
  function isEditable(day: string) {
    const d = startOfDay(parseISO(day));
    return !isAfter(d, today) && !isAfter(editFloor, d);
  }

  function handleClick(day: string) {
    if (!day || !onToggle || !isEditable(day)) return;
    onToggle(habit.id, day, !logByDate.get(day)?.completed);
  }

  // Completion intensity for a day: 0 = none, 4 = goal fully met (or done when
  // the habit has no numeric goal).
  function levelFor(day: string): number {
    const log = logByDate.get(day);
    if (!log || !log.completed) return 0;
    if (habit.goal && log.value != null && log.value > 0) {
      const r = Math.max(0, Math.min(1, log.value / habit.goal));
      return r >= 1 ? 4 : r >= 0.66 ? 3 : r >= 0.34 ? 2 : 1;
    }
    return 4;
  }

  // Shade for a completed cell at the given level (used by cells + legend).
  function shade(level: number): React.CSSProperties {
    if (level <= 0) return { backgroundColor: "#1f1f1f", opacity: 0.5 };
    return {
      backgroundColor: habit.color,
      opacity: OPACITY[level],
      boxShadow: level === 4 ? `0 0 5px ${habit.color}80` : undefined,
    };
  }

  const MONTHS = Array.from({ length: 12 }, (_, m) =>
    format(new Date(2000, m, 1), "MMM", { locale: dfLocale(lang) })
  );
  // Weekday labels for Mon/Wed/Fri rows (Jan 1 2023 was a Sunday).
  const weekdayLabel = (row: number) =>
    row === 1
      ? format(new Date(2023, 0, 2), "EEE", { locale: dfLocale(lang) })
      : row === 3
      ? format(new Date(2023, 0, 4), "EEE", { locale: dfLocale(lang) })
      : row === 5
      ? format(new Date(2023, 0, 6), "EEE", { locale: dfLocale(lang) })
      : "";

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-1.5">
        {/* Weekday labels (Mon / Wed / Fri) */}
        <div className="flex flex-col gap-px" style={{ paddingTop: ROW_OFFSET }}>
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} style={{ height: CELL }} className="flex items-center">
              <span className="text-[8px] text-muted leading-none">{weekdayLabel(row)}</span>
            </div>
          ))}
        </div>

        {/* Months + grid */}
        <div>
          {/* Month labels */}
          <div className="flex gap-px mb-1" style={{ height: ROW_OFFSET - 4 }}>
            {weeks.map((wk, wi) => {
              const firstReal = wk.find((d) => d !== "");
              if (!firstReal) return <div key={wi} style={{ width: CELL + 1 }} />;
              const d = parseISO(firstReal);
              return (
                <div key={wi} style={{ width: CELL + 1, minWidth: CELL + 1 }} className="text-center">
                  {d.getDate() <= 7 && (
                    <span className="text-[8px] text-muted leading-none">{MONTHS[d.getMonth()]}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-px">
            {weeks.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-px">
                {wk.map((day, di) => {
                  if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                  const log = logByDate.get(day);
                  const frozen = !!log?.frozen && !log?.completed;
                  const level = levelFor(day);
                  const isFuture = isAfter(startOfDay(parseISO(day)), today);
                  const isToday = day === todayKey;

                  const base: React.CSSProperties = isFuture
                    ? { backgroundColor: "#161616", opacity: 0.4 }
                    : frozen
                    ? { backgroundColor: habit.color, opacity: 0.16 }
                    : shade(level);

                  return (
                    <div
                      key={di}
                      title={`${day}${level ? " ✓" : frozen ? " · rest" : ""}`}
                      onClick={() => handleClick(day)}
                      style={{
                        width: CELL,
                        height: CELL,
                        ...base,
                        outline: isToday ? `1px solid ${habit.color}` : undefined,
                        outlineOffset: "1px",
                      }}
                      className={`rounded-[2px] transition-all ${
                        isEditable(day) ? "cursor-pointer hover:ring-1 hover:ring-white/40" : "cursor-default"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 justify-end mt-2.5 pr-1">
        <span className="text-[8px] text-muted">{lang === "hu" ? "Kevesebb" : lang === "ro" ? "Mai puțin" : "Less"}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className="rounded-[2px]" style={{ width: 9, height: 9, ...shade(l) }} />
        ))}
        <span className="text-[8px] text-muted">{lang === "hu" ? "Több" : lang === "ro" ? "Mai mult" : "More"}</span>
      </div>
    </div>
  );
}
