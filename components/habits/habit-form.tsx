"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2, ChevronDown, Plus, Tag, Check } from "lucide-react";
import { HABIT_ICONS } from "@/lib/habit-icons";
import { HabitFormData, HabitWithLogs } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#7f49c3","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#06b6d4","#84cc16","#f97316"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_VALS = ["mon","tue","wed","thu","fri","sat","sun"];

const DEFAULT_CATEGORIES = [
  { label: "Health",       emoji: "✚" },
  { label: "Fitness",      emoji: "◆" },
  { label: "Mindfulness",  emoji: "○" },
  { label: "Learning",     emoji: "≡" },
  { label: "Work",         emoji: "▪" },
  { label: "Creativity",   emoji: "✎" },
  { label: "Social",       emoji: "◎" },
  { label: "Finance",      emoji: "∞" },
  { label: "Sleep",        emoji: "◌" },
  { label: "Nutrition",    emoji: "✿" },
  { label: "Spirituality", emoji: "✦" },
  { label: "Productivity", emoji: "★" },
];

const STORAGE_KEY = "phantom-tracker-categories";

function loadCategories(): typeof DEFAULT_CATEGORIES {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveCategories(cats: typeof DEFAULT_CATEGORIES) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

// ─── Category dropdown ────────────────────────────────────────────────────────
function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState(loadCategories);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("◆");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function select(label: string) {
    onChange(value === label ? "" : label);
    setOpen(false);
  }

  function addCategory() {
    if (!newLabel.trim()) return;
    const cat = { label: newLabel.trim(), emoji: newEmoji };
    const updated = [...categories, cat];
    setCategories(updated);
    saveCategories(updated);
    onChange(cat.label);
    setNewLabel("");
    setNewEmoji("🏷️");
    setAdding(false);
    setOpen(false);
  }

  function removeCategory(label: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = categories.filter((c) => c.label !== label);
    setCategories(updated);
    saveCategories(updated);
    if (value === label) onChange("");
  }

  const selected = categories.find((c) => c.label === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm transition-colors hover:border-primary/50 focus:outline-none focus:border-primary"
        style={{ borderColor: open ? "#7f49c3" : undefined }}
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <span className="text-primary font-medium">{selected.emoji}</span>
              <span className="text-white">{selected.label}</span>
            </>
          ) : (
            <>
              <Tag size={13} className="text-muted" />
              <span className="text-muted">Select category…</span>
            </>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Category list */}
            <div className="max-h-52 overflow-y-auto py-1">
              {categories.map((cat) => {
                const active = value === cat.label;
                return (
                  <div
                    key={cat.label}
                    onClick={() => select(cat.label)}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-surface transition-colors group/item"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium" style={{ color: active ? "#7f49c3" : "#a1a1aa" }}>{cat.emoji}</span>
                      <span className={`text-sm ${active ? "text-primary font-medium" : "text-white"}`}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {active && <Check size={12} className="text-primary" />}
                      {/* Remove — only show for custom (non-default) cats */}
                      {!DEFAULT_CATEGORIES.find((d) => d.label === cat.label) && (
                        <button
                          onClick={(e) => removeCategory(cat.label, e)}
                          className="opacity-0 group-hover/item:opacity-100 text-muted hover:text-red-400 transition-all p-0.5 rounded"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add new */}
            <div className="border-t border-border">
              {adding ? (
                <div className="p-2 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-10 h-8 text-center bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                    maxLength={2}
                  />
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCategory();
                      if (e.key === "Escape") { setAdding(false); setNewLabel(""); }
                    }}
                    placeholder="Category name…"
                    className="flex-1 h-8 px-2 bg-surface border border-border rounded-md text-sm text-white placeholder-muted focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={!newLabel.trim()}
                    className="h-8 px-2.5 bg-primary hover:bg-primary-dim text-white text-xs rounded-md disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:text-primary hover:bg-surface transition-colors"
                >
                  <Plus size={13} />
                  New category
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
interface HabitFormProps {
  initial?: HabitWithLogs;
  onSubmit: (data: HabitFormData) => Promise<void>;
  onClose: () => void;
}

export function HabitForm({ initial, onSubmit, onClose }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Target");
  const [color, setColor] = useState(initial?.color ?? "#7f49c3");
  const [frequency, setFrequency] = useState(initial?.frequency ?? "daily");
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initial?.frequency === "daily" || !initial?.frequency
      ? DAYS_VALS
      : initial.frequency.split(",")
  );
  const [goal, setGoal] = useState(initial?.goal?.toString() ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [loading, setLoading] = useState(false);

  function toggleDay(d: string) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const freq = frequency === "daily" ? "daily" : selectedDays.join(",");
    await onSubmit({
      name: name.trim(),
      icon,
      color,
      frequency: freq,
      goal: goal ? parseInt(goal) : undefined,
      category: category || undefined,
    });
    setLoading(false);
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-10 max-h-[85dvh] flex flex-col overflow-hidden"
        >
          {/* Fixed header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="font-semibold text-sm">
              {initial ? "Edit habit" : "New habit"}
            </h2>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            {/* Scrollable fields */}
            <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            {/* Name */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning run"
                required
                className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Icon</label>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {HABIT_ICONS.map(({ name, Icon, label }) => {
                  const selected = icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={label}
                      onClick={() => setIcon(name)}
                      style={{
                        color: selected ? "white" : color,
                        borderColor: selected ? color : "#222",
                        backgroundColor: selected ? color : `${color}12`,
                        boxShadow: selected ? `0 0 10px ${color}50` : undefined,
                      }}
                      className="w-full aspect-square rounded-xl border flex items-center justify-center transition-all hover:border-primary/60"
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c ? "ring-2 ring-offset-2 ring-offset-surface ring-white scale-110" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Frequency</label>
              <div className="flex gap-2 mb-2">
                {["daily", "custom"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      frequency === f
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-muted hover:text-white border border-border"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {frequency === "custom" && (
                <div className="flex gap-1.5">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(DAYS_VALS[i])}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedDays.includes(DAYS_VALS[i])
                          ? "bg-primary text-white"
                          : "bg-surface-2 text-muted border border-border"
                      }`}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Category</label>
              <CategoryPicker value={category} onChange={setCategory} />
            </div>

            {/* Goal */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">Daily goal <span className="opacity-50">(optional)</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. 50"
                  min={1}
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
                {goal && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">/ day</span>
                )}
              </div>
              <p className="text-[11px] text-muted mt-1.5">A count to hit each day (e.g. 50 push-ups). Leave empty for a simple done/skip habit.</p>
            </div>
            </div>

            {/* Fixed footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {initial ? "Save changes" : "Create habit"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
