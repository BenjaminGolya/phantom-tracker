"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Ghost } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { AnimatePresence } from "framer-motion";
import { HabitWithLogs, HabitFormData } from "@/types";
import { HabitCard, ProgressRange } from "@/components/habits/habit-card";
import { HabitGrid } from "@/components/habits/habit-grid";
import { HabitForm } from "@/components/habits/habit-form";

interface HabitsClientProps {
  habits: HabitWithLogs[];
}

export function HabitsClient({ habits: initialHabits }: HabitsClientProps) {
  const router = useRouter();
  const [habits, setHabits] = useState<HabitWithLogs[]>(initialHabits);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "grid">("cards");
  const [range, setRange] = useState<ProgressRange>("month");


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

  const filtered = habits.filter(
    (h) =>
      !h.archived &&
      (h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const archived = habits.filter((h) => h.archived);

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
    if (!res.ok) return;
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this habit and all its history?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold">Habits</h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Range toggle — only shown in cards view */}
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
                  {r === "week" ? "7d" : r === "month" ? "30d" : r === "year" ? "1y" : "All"}
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
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow"
          >
            <Plus size={14} />
            New
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
          placeholder="Search habits… (/)"
          className="w-full pl-8 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Active habits */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
            <Ghost size={24} className="text-primary opacity-60" />
          </div>
          <p className="text-sm text-muted">No habits found</p>
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
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // Year grid view
        <div className="space-y-6">
          {filtered.map((habit) => {
            const HabitIcon = getHabitIcon(habit.icon);
            return (
            <div key={habit.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: habit.color }}><HabitIcon size={16} /></span>
                <span className="text-sm font-medium">{habit.name}</span>
              </div>
              <HabitGrid habit={habit} onToggle={handleToggle} />
            </div>
            );
          })}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xs text-muted uppercase tracking-wider mb-3">Archived</h2>
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
          onSubmit={editingHabit ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingHabit(null); }}
        />
      )}
    </div>
  );
}
