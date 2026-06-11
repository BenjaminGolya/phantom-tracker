// Single source of truth for the app version + a short changelog.
// Bump APP_VERSION and prepend a CHANGELOG entry whenever you ship something
// users actually notice. Skip pure copy tweaks and tiny i18n fixes — keep this
// list to features, fixes, and meaningful improvements.

export const APP_VERSION = "1.14.0";

// What kind of change it is, so the UI can tag and prioritize it.
//   feature      — new capability users can do something with
//   fix          — a bug that was making something not work
//   improvement  — polish to something that already worked
export type ChangeKind = "feature" | "fix" | "improvement";

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  kind: ChangeKind;
  summary: string; // one short line — what shipped
  /** Highlight in the "What's new" modal and sort ahead of minor entries. */
  major?: boolean;
  /** Admin-only change — hidden from the user-facing "What's new" + changelog. */
  admin?: boolean;
};

// Most recent first. Curated: only entries worth a user's attention.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.14.0",
    date: "2026-06-11",
    kind: "feature",
    major: true,
    summary: "Profile levels reimagined as a cosmic journey (Dust → Eternal) with a sleek new level card and a clearer habit XP bar that shows your current and next level.",
  },
  {
    version: "1.13.3",
    date: "2026-06-11",
    kind: "improvement",
    summary: "Clearer dashboard actions — dedicated Complete and Rest buttons with one-tap undo, and tidier completed rows.",
  },
  {
    version: "1.13.2",
    date: "2026-06-11",
    kind: "feature",
    summary: "What's new: a quick summary of updates the first time you sign in after a release — view anytime in Settings.",
  },
  {
    version: "1.13.0",
    date: "2026-06-11",
    kind: "feature",
    major: true,
    summary: "Weekly & monthly habits — schedule habits for specific weekdays or days of the month. The dashboard now shows only what's due today, with a 'Coming up' list and scheduled days marked on every calendar.",
  },
  {
    version: "1.12.2",
    date: "2026-06-11",
    kind: "improvement",
    summary: "Clearer habit actions: dedicated Complete, Rest day, and Undo buttons, a confirmation before deleting, a tidier icon picker, and an easier reminder time selector.",
  },
  {
    version: "1.12.1",
    date: "2026-06-10",
    kind: "feature",
    summary: "Import your data from CSV or JSON, and manage or cancel your plan from a redesigned pricing page that highlights your current plan.",
  },
  {
    version: "1.12.0",
    date: "2026-06-10",
    kind: "feature",
    summary: "Add habit descriptions, 20 more icons, and tap-to-filter habit categories on the dashboard and habits page.",
  },
  {
    version: "1.11.1",
    date: "2026-06-09",
    kind: "improvement",
    summary: "Better SEO so the site is findable on Google, a faster-painting homepage, and favicon fixes.",
  },
  {
    version: "1.11.0",
    date: "2026-06-09",
    kind: "feature",
    summary: "Your profile world: a living planet that grows with you and a personality constellation, plus deeper Pro stats.",
  },
  {
    version: "1.10.0",
    date: "2026-06-08",
    kind: "improvement",
    summary: "The free plan now includes up to 4 habits.",
  },
  {
    version: "1.9.5",
    date: "2026-06-08",
    kind: "feature",
    summary: "The whole app and all emails now speak English, Magyar, and Română — switch any time from the language menu.",
  },
  {
    version: "1.7.0",
    date: "2026-06-07",
    kind: "feature",
    summary: "Sign in with Google.",
  },
  {
    version: "1.6.0",
    date: "2026-06-07",
    kind: "feature",
    summary: "Email two-factor authentication and stronger password rules.",
  },
  {
    version: "1.5.0",
    date: "2026-06-07",
    kind: "feature",
    summary: "Forgot your password? Reset it via an emailed link from the sign-in page.",
  },
  {
    version: "1.3.0",
    date: "2026-06-07",
    kind: "feature",
    summary: "Help & feedback — report bugs or ask questions right from Settings, with screenshots.",
  },
  {
    version: "1.2.0",
    date: "2026-06-07",
    kind: "improvement",
    summary: "Faster pages, lighter icons, and a friendlier loading screen.",
  },
  {
    version: "1.1.0",
    date: "2026-06-06",
    kind: "feature",
    summary: "Pro plan with a 14-day trial, account disable/delete, email change, and the new ghost logo.",
  },
  {
    version: "1.0.0",
    date: "2026-06-05",
    kind: "feature",
    summary: "Launch: habit tracking, streaks, levels & XP, reminders, stats and calendars.",
  },
];

export const LATEST = CHANGELOG[0];
