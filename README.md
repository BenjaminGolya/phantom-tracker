# 👻 Phantom Tracker

A dark, minimalist full-stack habit tracker. Build streaks, level up your habits, and stay consistent — all wrapped in a clean phantom-purple aesthetic.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss)

---

## ✨ Features

- **Habit management** — Create, edit, archive, and delete habits with custom icons, colors, categories, and frequencies (daily or specific days).
- **Daily goals** — Set a numeric target per habit (e.g. 50 push-ups). Track partial progress with a counter and a "complete all" shortcut.
- **Progress calendars** — View each habit's history across selectable ranges: **7d / 30d / 1y / All**, rendered as compact weekly, monthly, or contribution-style calendars.
- **Habit levels (unlimited)** — Every completion earns XP. Habits level up infinitely on a quadratic curve and pass through tiers: 🌱 Seed → 🌿 Sprout → 🌳 Grower → ⚡ Achiever → 🔥 Expert → 👑 Champion → 💎 Legend, with a level-up animation.
- **Profile level system** — A meta-level (🌫️ Wanderer → 👻 Phantom) earned from multiple XP sources: base completions, streak bonuses, perfect days, category diversity, and habit mastery — all shown transparently in the Stats page.
- **Dashboard** — Today's checklist, current stats (active habits, best streak, today's %, phantom score), and a perfect-day confetti celebration.
- **Stats** — Profile-level hero card with XP breakdown, weekly completion bar chart, and a per-habit level tracker.
- **Authentication** — Email/password sign-up with **6-digit email verification**, secure login (NextAuth + bcrypt), and verified-only access.
- **CSV export** — Download all your habit data.
- **PWA-ready** — Installable with a web manifest and theme color.
- Keyboard shortcuts (`N` for new habit, `/` to search), responsive sidebar + mobile nav.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + `tailwindcss-animate` |
| Database | SQLite via Prisma 7 (`@prisma/adapter-libsql`) |
| Auth | NextAuth.js (Credentials, JWT sessions) |
| Email | Nodemailer (SMTP) |
| Charts | Recharts |
| Animation | Framer Motion + canvas-confetti |
| Icons | Lucide React |
| Dates | date-fns |

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/BenjaminGolya/phantom-tracker.git
cd phantom-tracker
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
NEXTAUTH_SECRET="generate-a-long-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (SMTP) — used for 6-digit verification codes
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=your_smtp_api_key
SMTP_FROM="Phantom Tracker" <you@yourdomain.com>
```

> **Email setup:** [Resend](https://resend.com) (free tier) or Gmail (with an [App Password](https://myaccount.google.com/apppasswords)) both work.
> If SMTP is left blank, verification codes are **printed to the terminal** instead — handy for local development.
> On Resend's free plan you can only send to your own verified address until you [verify a domain](https://resend.com/domains).

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, verify your email, and start tracking.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
app/
  (auth)/          login, signup, verify pages
  (dashboard)/     dashboard, habits, stats, settings (protected)
  api/             auth, habits, export, user routes
components/
  dashboard/       dashboard client, today checklist, stat cards
  habits/          habit card, form, grid, client
  layout/          sidebar, topbar, mobile nav
  stats/           stats client + level trackers
  settings/        settings client
lib/
  auth.ts          NextAuth config
  prisma.ts        Prisma client (libSQL adapter)
  email.ts         Nodemailer SMTP sender
  habit-icons.tsx  Shared Lucide icon map
  utils.ts         Streaks, levels, XP calculations
prisma/
  schema.prisma    Data models + migrations
types/             Shared TypeScript types
```

---

## 🔐 Auth Flow

1. User signs up → account created (unverified) → 6-digit code emailed.
2. User enters the code on `/verify` → email marked verified.
3. Verified users are auto-logged-in and can access the dashboard.
4. Login is blocked until the email is verified.

---

Built with Next.js · Designed for consistency.
