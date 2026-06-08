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
