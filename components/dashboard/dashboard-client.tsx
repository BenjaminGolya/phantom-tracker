"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Flame, Target, Zap, CheckCircle2, Plus, Globe, ChevronRight } from "lucide-react";
import { HabitWithLogs } from "@/types";
import { calcStreak, phantomScore } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { HabitForm } from "@/components/habits/habit-form";
import { TodayChecklist } from "@/components/dashboard/today-checklist";
import { Onboarding, type Template } from "@/components/dashboard/onboarding";
import { StatCard } from "@/components/dashboard/stat-card";
import { useLang } from "@/lib/i18n/context";
import { dfLocale } from "@/lib/i18n/date";
import confetti from "canvas-confetti";

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];

interface DashboardClientProps {
  habits: HabitWithLogs[];
  pro?: boolean;
}

export function DashboardClient({ habits: initialHabits, pro = false }: DashboardClientProps) {
  const router = useRouter();
  const mounted = useMounted();
  const { t, lang } = useLang();
  const [habits, setHabits] = useState<HabitWithLogs[]>(initialHabits);
  const [showForm, setShowForm] = useState(false);
  // Undo toast: stores the PREVIOUS state to revert a just-made toggle.
  const [undo, setUndo] = useState<{ habitId: string; date: string; completed: boolean; value: number | null } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);

  // Keep local state in sync with fresh server data after navigation/refresh
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  const today = format(new Date(), "yyyy-MM-dd");

  // Keyboard shortcut N = new habit
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowForm(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bestStreak = Math.max(0, ...habits.map((h) => calcStreak(h.logs).current));
  const score = phantomScore(habits.map((h) => ({ logs: h.logs })));

  const todayCompleted = habits.filter((h) =>
    h.logs.some((l) => l.date === today && l.completed)
  ).length;
  const todayTotal = habits.length;
  const todayPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  async function handleToggle(habitId: string, date: string, completed: boolean, value?: number, silent = false) {
    // Capture the previous state for this habit/date so we can offer an undo.
    const prevLog = habits.find((h) => h.id === habitId)?.logs.find((l) => l.date === date);
    const prev = { completed: prevLog?.completed ?? false, value: prevLog?.value ?? null };

    const res = await fetch(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, completed, value: value ?? null }),
    });
    if (!res.ok) return;
    const log = await res.json();

    if (!silent) {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setUndo({ habitId, date, completed: prev.completed, value: prev.value });
      undoTimer.current = setTimeout(() => setUndo(null), 5000);
    }

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const existing = h.logs.findIndex((l) => l.date === date);
        const logs = existing >= 0
          ? h.logs.map((l, i) => (i === existing ? log : l))
          : [...h.logs, log];
        return { ...h, logs };
      })
    );
    router.refresh();

    // Confetti if all done today
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const existing = h.logs.findIndex((l) => l.date === date);
      const logs = existing >= 0
        ? h.logs.map((l, i) => (i === existing ? { ...l, completed } : l))
        : [...h.logs, { id: "tmp", habitId, date, completed, value: null }];
      return { ...h, logs };
    });
    const allDone = updated.every((h) =>
      h.logs.some((l) => l.date === today && l.completed)
    );
    if (allDone && completed && habits.length > 0) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7f49c3","#9b6bff","#ffffff"] });
    }

    // Streak milestone celebration for the habit just completed.
    if (completed && !silent) {
      const toggled = updated.find((h) => h.id === habitId);
      if (toggled) {
        const streak = calcStreak(toggled.logs).current;
        if (STREAK_MILESTONES.includes(streak)) {
          confetti({ particleCount: 160, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors: ["#f97316","#fbbf24","#7f49c3","#ffffff"] });
          if (undoTimer.current) clearTimeout(undoTimer.current);
          setUndo(null);
          setMilestone(streak);
          setTimeout(() => setMilestone(null), 4500);
        }
      }
    }
  }

  async function handleCreateHabit(data: { name: string; icon: string; color: string; frequency: string; goal?: number; category?: string }) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const habit = await res.json();
    setHabits((prev) => [...prev, habit]);
    setShowForm(false);
    router.refresh();
  }

  // Create a batch of starter habits from the onboarding templates.
  async function handleCreateTemplates(templates: Template[]) {
    for (const tpl of templates) {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t(tpl.key),
          icon: tpl.icon,
          color: tpl.color,
          frequency: "daily",
          category: tpl.category,
          goal: tpl.goal,
        }),
      });
      if (res.ok) {
        const habit = await res.json();
        setHabits((prev) => [...prev, habit]);
      }
    }
    router.refresh();
  }

  // Avoid SSR/client hydration mismatch from date-based values: render a
  // lightweight shell until mounted, then the real (client-local) content.
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-28 lg:pb-6">
        <div className="h-9" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("common.dashboard")}</h1>
          <p className="text-sm text-muted">{format(new Date(), "EEEE, MMMM d", { locale: dfLocale(lang) })}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow"
        >
          <Plus size={14} />
          {t("dash.newHabit")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t("dash.activeHabits")}
          value={habits.length}
          icon={<Target size={16} className="text-primary" />}
        />
        <StatCard
          label={t("dash.bestStreak")}
          value={`${bestStreak} ${bestStreak !== 1 ? t("dash.days") : t("dash.day")}`}
          icon={<Flame size={16} className="text-orange-400" />}
        />
        <StatCard
          label={t("dash.today")}
          value={`${todayPct}%`}
          icon={<CheckCircle2 size={16} className="text-green-400" />}
          sub={`${todayCompleted}/${todayTotal} ${t("dash.done")}`}
        />
        <StatCard
          label={t("dash.phantomScore")}
          value={score}
          icon={<Zap size={16} className="text-primary" />}
          sub={t("dash.weekly")}
          highlight={score >= 80}
        />
      </div>

      {/* Link to the profile world */}
      <Link
        href="/stats"
        className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-primary/40 transition-all group"
      >
        <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Globe size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white leading-tight">{t("dash.yourWorld")}</p>
          <p className="text-[11px] text-muted truncate">{t("dash.yourWorldSub")}</p>
        </div>
        <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors shrink-0" />
      </Link>

      {/* Today's checklist */}
      {habits.length > 0 ? (
        <TodayChecklist habits={habits} onToggle={handleToggle} />
      ) : (
        <Onboarding pro={pro} onCreate={handleCreateTemplates} onCustom={() => setShowForm(true)} />
      )}

      {showForm && (
        <HabitForm
          pro={pro}
          onSubmit={handleCreateHabit}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Streak milestone celebration */}
      {milestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-surface border border-orange-500/40 shadow-2xl shadow-black/50"
          style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem)" }}
        >
          <span className="text-2xl">🔥</span>
          <span className="text-sm font-semibold text-white">{t("dash.streakMilestone").replace("{n}", String(milestone))}</span>
        </motion.div>
      )}

      {/* Undo toast */}
      {undo && !milestone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-2 border border-border shadow-2xl shadow-black/50"
          style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem)" }}
        >
          <span className="text-sm text-muted">{t("dash.updated")}</span>
          <button
            onClick={() => {
              if (undoTimer.current) clearTimeout(undoTimer.current);
              handleToggle(undo.habitId, undo.date, undo.completed, undo.value ?? undefined, true);
              setUndo(null);
            }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("dash.undo")}
          </button>
        </motion.div>
      )}
    </div>
  );
}

