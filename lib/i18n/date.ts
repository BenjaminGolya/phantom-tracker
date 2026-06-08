import { hu, ro } from "date-fns/locale";
import type { Locale as DateLocale, Day } from "date-fns";
import { type Locale } from "./config";

// Map our app language to a date-fns locale (undefined = default English).
export function dfLocale(lang: Locale): DateLocale | undefined {
  return lang === "hu" ? hu : lang === "ro" ? ro : undefined;
}

// Localized one-letter weekday initials, starting Sunday (matches our calendars).
export function weekdayInitials(lang: Locale): string[] {
  const loc = dfLocale(lang);
  if (!loc) return ["S", "M", "T", "W", "T", "F", "S"];
  // date-fns narrow weekday names; localize returns 0=Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    (loc.localize?.day(i as Day, { width: "narrow" }) as string) ?? ""
  );
}
