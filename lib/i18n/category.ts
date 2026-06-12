import { translate, type DictKey } from "./dictionaries";
import { type Locale } from "./config";

// Default category labels are stored in English on habits. This maps such a
// value to its translated label; custom (user-made) categories pass through.
const DEFAULTS = new Set([
  "Health", "Fitness", "Mindfulness", "Learning", "Work", "Creativity",
  "Social", "Finance", "Sleep", "Nutrition", "Spirituality", "Productivity",
]);

export function categoryLabel(value: string | null | undefined, lang: Locale): string {
  if (!value) return "";
  return DEFAULTS.has(value) ? translate(lang, `cat.${value}` as DictKey) : value;
}

// Icons for the built-in categories (match the picker). Custom-category icons
// are stored per-device in localStorage; unknown ones fall back to a glyph.
const CAT_ICONS: Record<string, string> = {
  Health: "✚", Fitness: "◆", Mindfulness: "○", Learning: "≡",
  Work: "▪", Creativity: "✎", Social: "◎", Finance: "∞",
  Sleep: "◌", Nutrition: "✿", Spirituality: "✦", Productivity: "★",
};
const CAT_STORAGE_KEY = "phantom-tracker-categories";

/** Deterministic icon (built-ins only) - safe for SSR / first render. */
export function categoryIconDefault(label: string | null | undefined): string {
  return (label && CAT_ICONS[label]) || "";
}

/** Full icon lookup incl. custom categories from localStorage (client only). */
export function categoryIcon(label: string | null | undefined): string {
  if (!label) return "";
  if (CAT_ICONS[label]) return CAT_ICONS[label];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CAT_STORAGE_KEY);
      if (raw) {
        const found = (JSON.parse(raw) as { label: string; emoji: string }[]).find((c) => c.label === label);
        if (found?.emoji) return found.emoji;
      }
    } catch { /* ignore */ }
  }
  return "◆"; // fallback glyph for an unknown custom category
}
