"use client";

import Link from "next/link";
import { Smartphone, Plus, Bell, ChevronRight, ArrowLeft, Apple, Play } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { useT } from "@/lib/i18n/context";

// Dedicated About + Install page (reached from the account menu "About & install").
// Public route: works logged in or out. Reuses the install-step translations.
export function WelcomeClient() {
  const t = useT();

  const steps = [
    { n: 1, icon: <Smartphone size={16} className="text-primary" />, title: t("lp.step1Title"), items: ["lp.step1a", "lp.step1b", "lp.step1c", "lp.step1d"] as const },
    { n: 2, icon: <Plus size={16} className="text-primary" />, title: t("lp.step2Title"), items: ["lp.step2a", "lp.step2b", "lp.step2c", "lp.step2d"] as const },
    { n: 3, icon: <Bell size={16} className="text-primary" />, title: t("lp.step3Title"), items: ["lp.step3a", "lp.step3b", "lp.step3c", "lp.step3d"] as const },
  ];

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      <div className="relative max-w-3xl mx-auto px-5 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={15} /> {t("common.backToHome")}
        </Link>

        {/* About */}
        <div className="text-center mb-12">
          <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("common.aboutInstall")}</h1>
          <p className="text-muted mt-3 max-w-lg mx-auto leading-relaxed">{t("welcome.aboutBody")}</p>
        </div>

        {/* Install */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight">{t("lp.installTitle")}</h2>
          <p className="text-muted mt-2 max-w-lg mx-auto text-sm">{t("lp.installSubtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{s.n}</span>
                {s.icon}
                <h3 className="text-sm font-semibold">{s.title}</h3>
              </div>
              <ol className="text-sm text-muted space-y-2 list-decimal pl-4 leading-relaxed">
                {s.items.map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Native apps - coming soon */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted">{t("lp.storesComingSoon")}</p>
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
        </div>

        <p className="text-xs text-muted text-center mt-6">{t("lp.installNote")}</p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-6 py-3 rounded-xl transition-all hover:shadow-glow"
          >
            {t("common.dashboard")} <ChevronRight size={15} />
          </Link>
          <Link
            href="/settings#newsletter"
            className="inline-flex items-center gap-1.5 border border-border hover:border-primary/40 text-sm font-medium text-muted hover:text-white px-6 py-3 rounded-xl transition-colors"
          >
            <Bell size={15} /> {t("set.newsletter")}
          </Link>
        </div>
      </div>
    </div>
  );
}
