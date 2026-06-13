"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Ghost, Sparkles, Lock, Trash2 } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/plan";
import { getHabitIcon } from "@/lib/habit-icons";
import { AnimatePresence } from "framer-motion";
import { HabitWithLogs, HabitFormData } from "@/types";
import { HabitCard, ProgressRange } from "@/components/habits/habit-card";
import { HabitGrid } from "@/components/habits/habit-grid";
import { HabitForm } from "@/components/habits/habit-form";
import { CategoryFilter, usedCategories } from "@/components/habits/category-filter";
import { useMounted } from "@/lib/use-mounted";
import { useT } from "@/lib/i18n/context";

interface HabitsClientProps {
  habits: HabitWithLogs[];
  pro?: boolean;
}

export function HabitsClient({ habits: initialHabits, pro = false }: HabitsClientProps) {
  const router = useRouter();
  const mounted = useMounted();
  const t = useT();
  const [habits, setHabits] = useState<HabitWithLogs[]>(initialHabits);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HabitWithLogs | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "grid">("cards");
  const [range, setRange] = useState<ProgressRange>("month");
  // The grid view keeps its own window, defaulting to the full year.
  const [gridRange, setGridRange] = useState<"week" | "month" | "year">("year");

  // Keep local state in sync with fresh server data after navigation/refresh
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        setShowForm(true);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.getElementById("habit-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = (h: HabitWithLogs) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.category?.toLowerCase().includes(search.toLowerCase());

  const visible = habits.filter((h) => !h.archived);
  const categories = usedCategories(habits.filter((h) => pro || !h.locked));
  const filtered = visible.filter(
    (h) => (pro || !h.locked) && matches(h) && (!catFilter || h.category === catFilter)
  );
  const lockedHabits = pro ? [] : visible.filter((h) => h.locked && matches(h));
  const archived = habits.filter((h) => h.archived);

  const activeCount = visible.filter((h) => pro || !h.locked).length;
  const atLimit = !pro && activeCount >= PLAN_LIMITS.freeHabitLimit;

  function handleNew() {
    if (atLimit) {
      router.push("/pricing");
      return;
    }
    setShowForm(true);
  }

  async function handleToggle(habitId: string, date: string, completed: boolean, value?: number) {
    const res = await fetch(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, completed, value: value ?? null }),
    });
    if (!res.ok) return;
    const log = await res.json();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const idx = h.logs.findIndex((l) => l.date === date);
        const logs = idx >= 0 ? h.logs.map((l, i) => (i === idx ? log : l)) : [...h.logs, log];
        return { ...h, logs };
      })
    );
    router.refresh();
  }

  async function handleCreate(data: HabitFormData) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      if (res.status === 403) {
        setShowForm(false);
        router.push("/pricing");
      }
      return;
    }
    const habit = await res.json();
    setHabits((prev) => [...prev, habit]);
    setShowForm(false);
    router.refresh();
  }

  async function handleEdit(data: HabitFormData) {
    if (!editingHabit) return;
    const res = await fetch(`/api/habits/${editingHabit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, archived: editingHabit.archived }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setEditingHabit(null);
    router.refresh();
  }

  // Open the themed confirmation modal instead of deleting immediately.
  function handleDelete(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (habit) setDeleteTarget(habit);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
    router.refresh();
  }

  // Move a habit up/down among the active (non-archived, non-locked) list and
  // persist the new order.
  async function handleMove(id: string, dir: "up" | "down") {
    const active = habits.filter((h) => !h.archived && (pro || !h.locked));
    const idx = active.findIndex((h) => h.id === id);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapWith < 0 || swapWith >= active.length) return;

    const reordered = [...active];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
    const orderIds = reordered.map((h) => h.id);
    const orderIndex = new Map(orderIds.map((hid, i) => [hid, i]));

    // Optimistic: re-sort local state to match.
    setHabits((prev) =>
      [...prev].sort((a, b) => (orderIndex.get(a.id) ?? 999) - (orderIndex.get(b.id) ?? 999))
    );

    await fetch("/api/habits/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: orderIds }),
    });
    router.refresh();
  }

  async function handleArchive(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const res = await fetch(`/api/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...habit, archived: !habit.archived }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    router.refresh();
  }

  // Habit cards render date-based calendars (new Date()), which would mismatch
  // between server and client. Render a shell until mounted to avoid hydration errors.
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-28 lg:pb-6">
        <div className="h-9" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">{t("nav.habits")}</h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Range toggle - cards view (week/month/year/all) */}
          {view === "cards" && (
            <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
              {(["week", "month", "year", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    range === r ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                  }`}
                >
                  {r === "week" ? "7d" : r === "month" ? "30d" : r === "year" ? "1y" : t("dash.all")}
                </button>
              ))}
            </div>
          )}
          {/* Range toggle - grid view (defaults to the full year) */}
          {view === "grid" && (
            <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
              {(["week", "month", "year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setGridRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    gridRange === r ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                  }`}
                >
                  {r === "week" ? "7d" : r === "month" ? "30d" : "1y"}
                </button>
              ))}
            </div>
          )}
          {/* View toggle */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
            {(["cards", "grid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  view === v ? "bg-surface-2 text-white" : "text-muted"
                }`}
              >
                {v === "cards" ? t("habits.cards") : t("habits.grid")}
              </button>
            ))}
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow"
          >
            <Plus size={14} />
            {t("habits.new")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="habit-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("habits.search")}
          className="w-full pl-8 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Category filter */}
      <CategoryFilter categories={categories} value={catFilter} onChange={setCatFilter} />

      {/* Free-plan usage / upgrade banner */}
      {!pro && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-primary/25 bg-primary/8">
          <p className="text-xs text-muted">
            <span className="font-mono font-semibold text-white">{activeCount}/{PLAN_LIMITS.freeHabitLimit}</span> {t("habits.usedFree")}
            {atLimit && <span className="text-primary"> · {t("habits.limitReached")}</span>}
          </p>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <Sparkles size={12} /> {t("habits.goPro")}
          </Link>
        </div>
      )}

      {/* Active habits */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
            <Ghost size={24} className="text-primary opacity-60" />
          </div>
          <p className="text-sm text-muted">{t("habits.noneFound")}</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                range={range}
                onToggleDay={handleToggle}
                onEdit={setEditingHabit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onCategoryClick={(c) => setCatFilter((prev) => (prev === c ? null : c))}
                {...(!search && !catFilter
                  ? { onMoveUp: (id) => handleMove(id, "up"), onMoveDown: (id) => handleMove(id, "down") }
                  : {})}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // Grid (contribution) view - year by default, switchable to month/week
        <div className="space-y-6">
          {filtered.map((habit) => {
            const HabitIcon = getHabitIcon(habit.icon);
            return (
            <div key={habit.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: habit.color }}><HabitIcon size={16} /></span>
                <span className="text-sm font-medium">{habit.name}</span>
              </div>
              <HabitGrid habit={habit} range={gridRange} onToggle={handleToggle} />
            </div>
            );
          })}
        </div>
      )}

      {/* Locked (over the free limit - kept safe, Pro unlocks) */}
      {lockedHabits.length > 0 && (
        <div>
          <h2 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lock size={12} /> {t("habits.lockedTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lockedHabits.map((habit) => {
              const HabitIcon = getHabitIcon(habit.icon);
              return (
                <div key={habit.id} className="relative bg-surface border border-border rounded-xl p-4 overflow-hidden">
                  <div className="blur-[3px] select-none pointer-events-none">
                    <div className="flex items-center gap-2.5">
                      <span style={{ color: habit.color }}><HabitIcon size={16} /></span>
                      <div>
                        <p className="text-sm font-medium text-white leading-tight">{habit.name}</p>
                        {habit.category && <p className="text-xs text-muted">{habit.category}</p>}
                      </div>
                    </div>
                    <div className="mt-3 h-1 rounded-full bg-surface-2" />
                    <div className="mt-3 grid grid-cols-7 gap-[2px]">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-6 rounded border border-border" />
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-surface/55 backdrop-blur-[1px]">
                    <Lock size={18} className="text-primary" />
                    <p className="text-xs text-muted text-center px-4">{t("habits.lockedMsg")}</p>
                    <Link href="/pricing" className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <Sparkles size={12} /> {t("habits.goPro")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xs text-muted uppercase tracking-wider mb-3">{t("habits.archived")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
            {archived.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                range={range}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {(showForm || editingHabit) && (
        <HabitForm
          initial={editingHabit ?? undefined}
          pro={pro}
          categoryOptions={Array.from(new Set(habits.map((h) => h.category).filter((c): c is string => !!c)))}
          onSubmit={editingHabit ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingHabit(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={16} className="text-red-400" />
              <h3 className="text-sm font-semibold">{t("habits.deleteTitle")}</h3>
            </div>
            <p className="text-xs text-muted mb-1.5 leading-relaxed">{t("habits.deleteBody")}</p>
            <div className="flex items-center gap-2.5 my-3">
              {(() => { const Icon = getHabitIcon(deleteTarget.icon); return <span style={{ color: deleteTarget.color }}><Icon size={14} /></span>; })()}
              <span className="text-sm font-medium text-white">{deleteTarget.name}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg bg-red-500/90 hover:bg-red-500 transition-colors"
              >
                <Trash2 size={13} /> {t("form.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
