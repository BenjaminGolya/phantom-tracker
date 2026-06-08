"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Ghost, Target, Flame, BarChart2, Bell, Trophy, Check, Plus,
  Smartphone, ChevronRight, CalendarDays, Sparkles,
  Settings, LogOut, X, Apple, Play,
} from "lucide-react";
import { GhostLogo, GhostAvatar } from "@/components/brand/ghost-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useT } from "@/lib/i18n/context";
import { PRICE_LABEL } from "@/lib/plan";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

// ─── A stylized mock habit card (the signature contribution-grid look) ────────
function HabitCardMock() {
  const t = useT();
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
          <p className="text-sm font-medium text-white leading-tight">{t("lp.demoHabitName")}</p>
          <p className="text-xs text-muted">{t("lp.demoHabitCat")}</p>
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
  const t = useT();
  const items = [
    { name: t("lp.demoDrinkWater"), icon: <Sparkles size={13} />, done: true },
    { name: t("lp.demoRead"), icon: <CalendarDays size={13} />, done: true },
    { name: t("lp.demoMeditate"), icon: <Ghost size={13} />, done: false },
    { name: t("lp.demoNoSugar"), icon: <Check size={13} />, done: false },
  ];
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl shadow-black/40 w-full">
      <p className="text-sm font-medium text-white mb-3">{t("lp.demoToday")}</p>
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
  { icon: <CalendarDays size={18} />, titleKey: "lp.f1Title", descKey: "lp.f1Desc" },
  { icon: <Trophy size={18} />, titleKey: "lp.f2Title", descKey: "lp.f2Desc" },
  { icon: <Flame size={18} />, titleKey: "lp.f3Title", descKey: "lp.f3Desc" },
  { icon: <Target size={18} />, titleKey: "lp.f4Title", descKey: "lp.f4Desc" },
  { icon: <Bell size={18} />, titleKey: "lp.f5Title", descKey: "lp.f5Desc" },
  { icon: <BarChart2 size={18} />, titleKey: "lp.f6Title", descKey: "lp.f6Desc" },
] as const;

// Account control shown in the landing nav when the visitor is logged in.
function NavAccount() {
  const { data } = useSession();
  const user = data?.user;
  const t = useT();
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
        {t("common.openApp")} <ChevronRight size={14} />
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
              {t("common.settings")}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              {t("common.signOut")}
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
  const t = useT();

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GhostLogo size={28} className="phantom-glow" />
            <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {authed ? (
              <NavAccount />
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted hover:text-white transition-colors px-3 py-1.5">
                  {t("common.signIn")}
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-primary hover:bg-primary-dim text-white px-3.5 py-1.5 rounded-lg transition-all hover:shadow-glow">
                  {t("common.getStarted")}
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
            <Sparkles size={12} className="text-primary" /> {t("lp.heroBadge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            {t("lp.heroTitle1")}{" "}
            <span className="bg-gradient-to-r from-primary to-phantom-300 bg-clip-text text-transparent">{t("lp.heroAccent")}</span>.
          </h1>
          <p className="text-base sm:text-lg text-muted mt-5 max-w-xl mx-auto leading-relaxed">
            {t("lp.heroSubtitle")}
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href={authed ? "/dashboard" : "/signup"} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all hover:shadow-glow">
              {authed ? t("lp.ctaOpen") : t("lp.ctaFree")} <ChevronRight size={15} />
            </Link>
            <Link href="#install" className="text-sm font-medium text-muted hover:text-white border border-border hover:border-primary/40 px-5 py-2.5 rounded-xl transition-colors">
              {t("lp.howItWorks")}
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
          {t("lp.featuresTitle")}
        </motion.h2>
        <motion.p {...fadeUp} className="text-muted text-center mt-3 max-w-lg mx-auto">
          {t("lp.featuresSubtitle")}
        </motion.p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.titleKey}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{t(f.titleKey)}</h3>
              <p className="text-sm text-muted leading-relaxed">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Plans — Free vs Pro */}
      <section id="plans" className="max-w-5xl mx-auto px-5 py-16">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("landing.plansTitle")}</h2>
          <p className="text-muted mt-3 max-w-md mx-auto">
            {t("landing.plansSubtitle")}
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted font-medium mb-1">{t("landing.free")}</p>
            <p className="text-3xl font-bold mb-5">€0<span className="text-sm text-muted font-normal">{t("landing.perForever")}</span></p>
            <ul className="space-y-2.5">
              {[
                { label: t("lp.freeHabits"), ok: true },
                { label: t("lp.dailyTracking"), ok: true },
                { label: t("lp.calendars"), ok: true },
                { label: t("lp.freeLevels"), ok: true },
                { label: t("lp.timedReminders"), ok: false },
                { label: t("lp.advStats"), ok: false },
                { label: t("lp.xpEliteFree"), ok: false },
                { label: t("lp.dataIO"), ok: false },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm">
                  {f.ok ? <Check size={15} className="text-green-400 shrink-0" /> : <X size={15} className="text-muted/40 shrink-0" />}
                  <span className={f.ok ? "text-white" : "text-muted line-through"}>{f.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href={authed ? "/dashboard" : "/signup"}
              className="mt-6 block text-center text-sm font-medium border border-border hover:border-primary/50 text-white py-2.5 rounded-xl transition-colors"
            >
              {authed ? t("common.dashboard") : t("common.startFree")}
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-surface border-2 border-primary/50 rounded-2xl p-6 shadow-[0_0_40px_#7f49c320]">
            <span className="absolute -top-2.5 right-5 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary text-white">
              {t("landing.mostPopular")}
            </span>
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-1 flex items-center gap-1">
              <Sparkles size={12} /> Pro
            </p>
            <p className="text-3xl font-bold">{PRICE_LABEL}</p>
            <p className="text-[11px] text-primary mb-5">{t("lp.proPriceSub")}</p>
            <ul className="space-y-2.5">
              {[
                t("lp.unlimited"),
                t("lp.pushReminders"),
                t("lp.advStatsInsights"),
                t("lp.xpExclusive"),
                t("lp.dataIO"),
                t("lp.everythingFree"),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check size={15} className="text-primary shrink-0" />
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={authed ? "/pricing" : "/signup"}
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-dim text-white py-2.5 rounded-xl transition-all hover:shadow-glow"
            >
              <Sparkles size={14} /> {authed ? t("lp.goPro") : t("common.startFree")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Install + notifications */}
      <section id="install" className="max-w-5xl mx-auto px-5 py-16">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("lp.installTitle")}</h2>
          <p className="text-muted mt-3 max-w-lg mx-auto">
            {t("lp.installSubtitle")}
          </p>

          {/* Native apps — coming soon (disabled store buttons) */}
          <p className="text-sm text-muted mt-6 max-w-lg mx-auto">{t("lp.storesComingSoon")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {[
              { icon: <Apple size={20} className="shrink-0" />, label: t("lp.appStore") },
              { icon: <Play size={18} className="shrink-0" />, label: t("lp.googlePlay") },
            ].map((s) => (
              <div
                key={s.label}
                aria-disabled
                className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-surface opacity-60 cursor-not-allowed select-none"
              >
                {s.icon}
                <span className="text-left leading-tight">
                  <span className="block text-[10px] text-muted">{t("lp.comingSoon")}</span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Step 1 — iPhone */}
          <motion.div {...fadeUp} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
              <Smartphone size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">{t("lp.step1Title")}</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>{t("lp.step1a")}</li>
              <li>{t("lp.step1b")}</li>
              <li>{t("lp.step1c")}</li>
              <li>{t("lp.step1d")}</li>
            </ol>
          </motion.div>

          {/* Step 2 — Android */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
              <Plus size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">{t("lp.step2Title")}</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>{t("lp.step2a")}</li>
              <li>{t("lp.step2b")}</li>
              <li>{t("lp.step2c")}</li>
              <li>{t("lp.step2d")}</li>
            </ol>
          </motion.div>

          {/* Step 3 — Notifications */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</span>
              <Bell size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">{t("lp.step3Title")}</h3>
            </div>
            <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
              <li>{t("lp.step3a")}</li>
              <li>{t("lp.step3b")}</li>
              <li>{t("lp.step3c")}</li>
              <li>{t("lp.step3d")}</li>
            </ol>
          </motion.div>
        </div>

        <motion.p {...fadeUp} className="text-xs text-muted text-center mt-5">
          {t("lp.installNote")}
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
            <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow mx-auto mb-5" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("landing.ctaFinalTitle")}</h2>
            <p className="text-muted mt-3 max-w-md mx-auto">{t("landing.ctaFinalSubtitle")}</p>
            <Link href={authed ? "/dashboard" : "/signup"} className="inline-flex items-center gap-1.5 mt-7 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-6 py-3 rounded-xl transition-all hover:shadow-glow">
              {authed ? t("lp.ctaOpen") : t("lp.ctaFree")} <ChevronRight size={15} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted">
            <GhostLogo size={16} />
            <span className="text-xs">{t("landing.footer")}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            {authed ? (
              <>
                <Link href="/dashboard" className="hover:text-white transition-colors">{t("common.dashboard")}</Link>
                <Link href="/settings" className="hover:text-white transition-colors">{t("common.settings")}</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-white transition-colors">{t("common.signIn")}</Link>
                <Link href="/signup" className="hover:text-white transition-colors">{t("common.getStarted")}</Link>
              </>
            )}
            <LanguageSwitcher openUp className="-my-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}
