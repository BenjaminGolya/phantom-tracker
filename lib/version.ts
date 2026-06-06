// Single source of truth for the app version + a short changelog.
// Bump APP_VERSION and prepend a CHANGELOG entry whenever you ship something.

export const APP_VERSION = "1.4.0";

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  summary: string; // one short line — what shipped
};

// Most recent first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-06-07",
    summary: "Attach screenshots to bug reports & feedback (up to 3 images).",
  },
  {
    version: "1.3.0",
    date: "2026-06-07",
    summary: "Help & feedback — report bugs or ask questions right from Settings.",
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
