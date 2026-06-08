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

export function HabitGrid({ habit, year, onToggle }: HabitGridProps) {
  const { lang } = useLang();
  const currentYear = year ?? new Date().getFullYear();
  const days = useMemo(() => getYearDays(currentYear), [currentYear]);

  const completedSet = useMemo(
    () => new Set(habit.logs.filter((l) => l.completed).map((l) => l.date)),
    [habit.logs]
  );

  const today = startOfDay(new Date());

  // Group by week for display
  const weeks: string[][] = [];
  let week: string[] = [];

  // Pad first week
  const firstDay = parseISO(days[0]);
  const firstDayOfWeek = firstDay.getDay(); // 0=Sun
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
    const completed = !completedSet.has(day);
    onToggle(habit.id, day, completed);
  }

  const MONTHS = Array.from({ length: 12 }, (_, m) =>
    format(new Date(2000, m, 1), "MMM", { locale: dfLocale(lang) })
  );

  return (
    <div className="w-full overflow-x-auto">
      {/* Month labels */}
      <div className="flex gap-px mb-1 pl-0" style={{ paddingLeft: 0 }}>
        {weeks.map((week, wi) => {
          const firstReal = week.find((d) => d !== "");
          if (!firstReal) return <div key={wi} style={{ width: 11 }} />;
          const d = parseISO(firstReal);
          const showMonth = d.getDate() <= 7;
          return (
            <div key={wi} style={{ width: 11, minWidth: 11 }} className="text-center">
              {showMonth && (
                <span className="text-[8px] text-muted leading-none">
                  {MONTHS[d.getMonth()]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-px">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} style={{ width: 10, height: 10 }} />;
              }
              const completed = completedSet.has(day);
              const isFuture = isAfter(startOfDay(parseISO(day)), today);
              const isToday = day === format(today, "yyyy-MM-dd");

              return (
                <div
                  key={di}
                  title={`${day}${completed ? " ✓" : ""}`}
                  onClick={() => handleClick(day)}
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: completed
                      ? habit.color
                      : isFuture
                      ? "#1a1a1a"
                      : "#1f1f1f",
                    opacity: completed ? 1 : isFuture ? 0.3 : 0.6,
                    outline: isToday ? `1px solid ${habit.color}` : undefined,
                    outlineOffset: "1px",
                  }}
                  className={`rounded-[2px] transition-all ${
                    isEditable(day) ? "cursor-pointer hover:ring-1 hover:ring-white/30" : "cursor-default"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
