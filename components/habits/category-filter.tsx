"use client";

import { useLang } from "@/lib/i18n/context";
import { categoryLabel } from "@/lib/i18n/category";
import { CategoryIcon } from "@/components/habits/category-icon";

// Pill row to filter habits by category. `value === null` means "All".
// Renders nothing if there are fewer than 2 categories (no point filtering).
export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string | null;
  onChange: (c: string | null) => void;
}) {
  const { t, lang } = useLang();
  if (categories.length < 2) return null;

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
      active
        ? "bg-primary/20 text-primary border-primary/40"
        : "text-muted border-border hover:text-white hover:border-border/80"
    }`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={() => onChange(null)} className={chip(value === null)}>
        {t("dash.all")}
      </button>
      {categories.map((c) => (
        <button key={c} onClick={() => onChange(c)} className={`${chip(value === c)} inline-flex items-center gap-1`}>
          <CategoryIcon label={c} /> {categoryLabel(c, lang)}
        </button>
      ))}
    </div>
  );
}

// Unique, sorted category values present in a list of habits.
export function usedCategories(habits: { category: string | null; archived?: boolean; locked?: boolean }[]): string[] {
  const set = new Set<string>();
  for (const h of habits) {
    if (h.archived || h.locked) continue;
    if (h.category) set.add(h.category);
  }
  return Array.from(set).sort();
}
