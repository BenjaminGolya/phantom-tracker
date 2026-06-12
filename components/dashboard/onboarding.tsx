"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, Loader2, Sparkles } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { PLAN_LIMITS } from "@/lib/plan";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { categoryLabel } from "@/lib/i18n/category";
import { CategoryIcon } from "@/components/habits/category-icon";

export type Template = {
  key: DictKey;     // i18n key for the habit name
  icon: string;
  color: string;
  category: string; // English default category (translated on display)
  goal?: number;
};

const TEMPLATES: Template[] = [
  { key: "onb.t.water",   icon: "Droplets",      color: "#38bdf8", category: "Health",       goal: 8 },
  { key: "onb.t.workout", icon: "Dumbbell",      color: "#f97316", category: "Fitness" },
  { key: "onb.t.read",    icon: "BookOpen",      color: "#a855f7", category: "Learning" },
  { key: "onb.t.meditate",icon: "Brain",         color: "#22c55e", category: "Mindfulness" },
  { key: "onb.t.walk",    icon: "Footprints",    color: "#14b8a6", category: "Fitness",      goal: 8000 },
  { key: "onb.t.sleep",   icon: "Moon",          color: "#6366f1", category: "Sleep" },
  { key: "onb.t.journal", icon: "PenLine",       color: "#eab308", category: "Mindfulness" },
  { key: "onb.t.eat",     icon: "Apple",         color: "#ef4444", category: "Nutrition" },
  { key: "onb.t.stretch", icon: "Activity",      color: "#ec4899", category: "Fitness" },
  { key: "onb.t.study",   icon: "GraduationCap", color: "#7f49c3", category: "Learning" },
];

export function Onboarding({
  pro,
  onCreate,
  onCustom,
}: {
  pro: boolean;
  onCreate: (templates: Template[]) => Promise<void>;
  onCustom: () => void;
}) {
  const { t, lang } = useLang();
  const limit = pro ? Infinity : PLAN_LIMITS.freeHabitLimit;
  const [selected, setSelected] = useState<Set<DictKey>>(new Set());
  const [saving, setSaving] = useState(false);

  const atCap = selected.size >= limit;

  function toggle(key: DictKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < limit) next.add(key);
      return next;
    });
  }

  async function add() {
    if (!selected.size) return;
    setSaving(true);
    await onCreate(TEMPLATES.filter((tpl) => selected.has(tpl.key)));
    // parent refreshes; if it doesn't unmount us, reset.
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
    >
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={22} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{t("onb.title")}</h2>
        <p className="text-sm text-muted mt-1 max-w-sm mx-auto">{t("onb.sub")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TEMPLATES.map((tpl) => {
          const Icon = getHabitIcon(tpl.icon);
          const sel = selected.has(tpl.key);
          const disabled = !sel && atCap;
          return (
            <button
              key={tpl.key}
              onClick={() => toggle(tpl.key)}
              disabled={disabled}
              className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                sel ? "border-primary/60 bg-primary/10" : "border-border hover:border-border/80"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <span style={{ color: tpl.color }} className="shrink-0"><Icon size={18} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white truncate">{t(tpl.key)}</span>
                <span className="text-[11px] text-muted truncate flex items-center gap-1"><CategoryIcon label={tpl.category} /> {categoryLabel(tpl.category, lang)}</span>
              </span>
              {sel && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-md bg-primary text-white flex items-center justify-center">
                  <Check size={11} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5">
        <button
          onClick={add}
          disabled={!selected.size || saving}
          className="w-full sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {selected.size > 0 ? t("onb.addN").replace("{n}", String(selected.size)) : t("onb.add")}
        </button>
        <button
          onClick={onCustom}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 border border-border text-sm font-medium text-muted hover:text-white hover:border-primary/40 rounded-lg transition-colors"
        >
          <Plus size={15} /> {t("onb.scratch")}
        </button>
      </div>
    </motion.div>
  );
}
