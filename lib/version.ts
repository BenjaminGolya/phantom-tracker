// Single source of truth for the app version + a short changelog.
// Bump APP_VERSION and prepend a CHANGELOG entry whenever you ship something.

export const APP_VERSION = "1.9.5";

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  summary: string; // one short line — what shipped
};

// Most recent first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.9.5",
    date: "2026-06-08",
    summary: "Cleaner Hungarian feature copy and a 'coming soon to the App Store & Google Play' note with store badges.",
  },
  {
    version: "1.9.4",
    date: "2026-06-08",
    summary: "Simpler Hungarian landing copy, 'streak' wording, a language switcher in the footer, and a cleaner mobile header.",
  },
  {
    version: "1.9.3",
    date: "2026-06-08",
    summary: "Polished the copy across the app and emails for a warmer, more human tone.",
  },
  {
    version: "1.9.2",
    date: "2026-06-08",
    summary: "Localized the landing-page demo cards and the top-bar menu (Home, Settings, Sign out).",
  },
  {
    version: "1.9.1",
    date: "2026-06-08",
    summary: "Localized calendars, dates, weekday/month names and level tiers, so there's no more English on the Magyar/Română UI.",
  },
  {
    version: "1.9.0",
    date: "2026-06-07",
    summary: "Full Hungarian & Romanian translations across the whole app and emails.",
  },
  {
    version: "1.7.0",
    date: "2026-06-07",
    summary: "Sign in with Google.",
  },
  {
    version: "1.6.0",
    date: "2026-06-07",
    summary: "Multi-language (English, Magyar, Română), email 2FA, and stronger password rules.",
  },
  {
    version: "1.5.0",
    date: "2026-06-07",
    summary: "Forgot-password: reset your password via an emailed link from the sign-in page.",
  },
  {
    version: "1.4.0",
    date: "2026-06-07",
    summary: "Attach screenshots to bug reports & feedback (up to 3 images).",
  },
  {
    version: "1.3.0",
    date: "2026-06-07",
    summary: "Help & feedback: report bugs or ask questions right from Settings.",
  },
  {
    version: "1.2.0",
    date: "2026-06-07",
    summary: "Jumping-phantom loading screen + performance boost (faster pages, lighter icons).",
  },
  {
    version: "1.1.0",
    date: "2026-06-06",
    summary: "Pro plan with 14-day trial, account disable/delete, email change, and the new ghost logo.",
  },
  {
    version: "1.0.0",
    date: "2026-06-05",
    summary: "Launch: habit tracking, streaks, levels & XP, reminders, stats and calendars.",
  },
];

export const LATEST = CHANGELOG[0];
