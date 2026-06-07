// Supported languages for the app.
export const LOCALES = ["en", "hu", "ro"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hu: "Magyar",
  ro: "Română",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  hu: "🇭🇺",
  ro: "🇷🇴",
};

export const LANG_COOKIE = "lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
