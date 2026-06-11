import { translate, type DictKey } from "./dictionaries";
import { type Locale } from "./config";

const KNOWN = new Set([
  // Habit tiers
  "Seed", "Sprout", "Grower", "Achiever", "Expert", "Champion", "Legend",
  // Profile levels (cosmic ascension)
  "Dust", "Spark", "Flame", "Beacon", "Comet", "Nova", "Pulsar", "Quasar",
  "Nebula", "Phantom", "Ascendant", "Ethereal", "Eternal",
]);

// Translate a habit-tier / profile-level label (English in code) for display.
export function levelLabel(label: string, lang: Locale): string {
  return KNOWN.has(label) ? translate(lang, `lvl.${label}` as DictKey) : label;
}
