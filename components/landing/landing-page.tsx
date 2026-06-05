"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Ghost, Target, Flame, BarChart2, Bell, Trophy, Check, Plus,
  Share, Smartphone, ChevronRight, CalendarDays, Sparkles, MoreHorizontal,
  Settings, LogOut,
} from "lucide-react";
import { GhostMark, GhostAvatar } from "@/components/brand/ghost-mark";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

// ─── A stylized mock habit card (the signature contribution-grid look) ────────
function HabitCardMock() {
  // Deterministic "activity" pattern so it never looks random/empty
  const weeks = 14;
  const days = 7;
  const filled = (w: number, d: number) => {
    const seed = (w * 7 + d * 3) % 11;
    return seed < 5 ? (seed < 2 ? 1 : 0.55) : 0;
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl shadow-black/40 w-full">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center text-primary">
          <Target size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white leading-tight">Morning run</p>
          <p className="text-xs text-muted">Fitness</p>
        </div>
        <div className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-md text-xs font-mono">
          <Flame size={10} /> 12
        </div>
      </div>
      {/* mini XP bar */}
      <div className="h-1 rounded-full bg-surface-2 overflow-hidden mb-3">
        <div className="h-full rounded-full bg-primary" style={{ width: "64%" }} />
      </div>
      {/* contribution grid */}
      <div className="flex gap-[3px] overflow-hidden">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: days }).map((_, d) => {
              const v = filled(w, d);
              return (
                <div
                  key={d}
                  className="w-[10px] h-[10px] rounded-[2px]"
                  style={{ background: v ? `rgba(127,73,195,${v})` : "#1f1f24" }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mock "today" checklist card ──────────────────────────────────────────────
function ChecklistMock() {
  const items = [
    { name: "Drink water", icon: <Sparkles size={13} />, done: true },
    { name: "Read 10 pages", icon: <CalendarDays size={13} />, done: true },
    { name: "Meditate", icon: <Ghost size={13} />, done: false },
    { name: "No sugar", icon: <Check size={13} />, done: false },
  ];
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl shadow-black/40 w-full">
      <p className="text-sm font-medium text-white mb-3">Today&apos;s habits</p>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-3 p-2.5 bg-surface-2 border border-border rounded-xl">
            <div
              className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0"
              style={{
                background: it.done ? "#7f49c3" : "rgba(127,73,195,0.1)",
                borderColor: it.done ? "#7f49c3" : "rgba(127,73,195,0.4)",
                color: it.done ? "#fff" : "#7f49c3",
              }}
            >
              {it.done ? <Check size={13} /> : it.icon}
            </div>
            <span className={`text-xs ${it.done ? "line-through text-muted" : "text-white"}`}>{it.name}</span>
            {it.done && <span className="ml-auto text-[11px] text-primary font-medium">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: <CalendarDays size={18} />, title: "Visual habit grid", desc: "Every day you show up fills a square. Watch your consistency build into a satisfying streak." },
  { icon: <Trophy size={18} />, title: "Levels & XP", desc: "Each habit levels up as you complete it, and you earn XP toward a profile rank from Wanderer to Phantom." },
  { icon: <Flame size={18} />, title: "Streaks", desc: "Build momentum with streak counters and bonus XP at 7, 14, and 30 days." },
  { icon: <Target size={18} />, title: "Daily goals", desc: "Track a count per day — 50 push-ups, 8 glasses of water — with a built-in counter." },
  { icon: <Bell size={18} />, title: "Smart reminders", desc: "Get a push notification at the time you choose — even with the app closed — until you've done it." },
  { icon: <BarChart2 size={18} />, title: "Stats & insights", desc: "See your weekly completion, best streaks, and exactly where your XP comes from." },
];

// Account control shown in the landing nav when the visitor is logged in.
function NavAccount() {
  const { data } = useSession();
  const user = data?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm font-medium bg-primary hover:bg-primary-dim text-white px-3.5 py-1.5 rounded-lg transition-all hover:shadow-glow"
      >
        Open app <ChevronRight size={14} />
      </Link>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center rounded-full hover:ring-2 hover:ring-primary/40 transition-all"
          aria-label="Account menu"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
          ) : (
            <GhostAvatar size={32} className="border border-primary/30" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-56 bg-surface-2 border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              {user?.name && <p className="text-xs font-medium text-white truncate">{user.name}</p>}
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Settings size={14} />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LandingPage() {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center phantom-glow">
              <GhostMark size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            {authed ? (
              <NavAccount />
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted hover:text-white transition-colors px-3 py-1.5">
                  Sign in
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-primary hover:bg-primary-dim text-white px-3.5 py-1.5 rounded-lg transition-all hover:shadow-glow">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted bg-surface border border-border rounded-full px-3 py-1 mb-6">
            <Sparkles size={12} className="text-primary" /> A dark, minimalist habit tracker
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Build habits that
            <span className="bg-gradient-to-r from-primary to-phantom-300 bg-clip-text text-transparent"> actually stick</span>.
          </h1>
          <p className="text-base sm:text-lg text-muted mt-5 max-w-xl mx-auto leading-relaxed">
            Track your habits, build streaks, level up, and get reminders that get you to show up —
            every single day. Free, on every device.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href={authed ? "/dashboard" : "/signup"} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all hover:shadow-glow">
              {authed ? "Open your dashboard" : "Get started — it's free"} <ChevronRight size={15} />
            </Link>
            <Link href="#install" className="text-sm font-medium text-muted hover:text-white border border-border hover:border-primary/40 px-5 py-2.5 rounded-xl transition-colors">
              How it works
            </Link>
          </div>
        </motion.div>

        {/* Hero mockups */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-14"
        >
          <HabitCardMock />
          <ChecklistMock />
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <motion.h2 {...fadeUp} className="text-2xl sm:text-3xl font-bold text-center tracking-tight">
          Everything you need to stay consistent
        </motion.h2>
        <motion.p {...fadeUp} className="text-muted text-center mt-3 max-w-lg mx-auto">
          Simple to use, satisfying to keep up — designed to make showing up the easy choice.
        </motion.p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Install + notifications */}
      <section id="install" className="max-w-5xl mx-auto px-5 py-16">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Use it like a real app</h2>
          <p className="text-muted mt-3 max-w-lg mx-auto">
            No app store needed. Add Phantom Tracker to your home screen and turn on reminders in under a minute.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Step 1 — iPhone */}
          <motion.div {...fadeUp} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
              <Smartphone size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Add to your iPhone</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>Open <span className="text-white">phantomtracker.io</span> in Safari</li>
              <li>Tap the <span className="inline-flex items-center gap-1 text-white"><Share size={12} /> Share</span> button</li>
              <li>Choose <span className="text-white">Add to Home Screen</span></li>
              <li>Open the app from your new icon 👻</li>
            </ol>
          </motion.div>

          {/* Step 2 — Android */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
              <Plus size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">…or your Android / desktop</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>Open the site in Chrome</li>
              <li>Tap the <span className="inline-flex items-center gap-1 text-white"><MoreHorizontal size={12} /> menu</span></li>
              <li>Choose <span className="text-white">Install app</span> / Add to Home screen</li>
              <li>Launch it like any installed app</li>
            </ol>
          </motion.div>

          {/* Step 3 — Notifications */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</span>
              <Bell size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Turn on reminders</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>Go to <span className="text-white">Settings → Reminders</span></li>
              <li>Tap <span className="text-white">Enable notifications</span> and allow</li>
              <li>Set a reminder time on any habit</li>
              <li>Get a push at that time — even with the app closed 🔔</li>
            </ol>
          </motion.div>
        </div>

        <motion.p {...fadeUp} className="text-xs text-muted text-center mt-5">
          📱 On iPhone, notifications require adding the app to your Home Screen first (Apple&apos;s rule) — the steps above set that up.
        </motion.p>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden bg-surface border border-primary/20 rounded-3xl p-10 text-center"
        >
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center phantom-glow mx-auto mb-5">
              <GhostMark size={28} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Start building better habits today</h2>
            <p className="text-muted mt-3 max-w-md mx-auto">It&apos;s free, takes a minute to set up, and works on every device.</p>
            <Link href={authed ? "/dashboard" : "/signup"} className="inline-flex items-center gap-1.5 mt-7 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-6 py-3 rounded-xl transition-all hover:shadow-glow">
              {authed ? "Open Phantom Tracker" : "Create your free account"} <ChevronRight size={15} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted">
            <GhostMark size={14} className="text-primary" />
            <span className="text-xs">Phantom Tracker — built for consistency.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
