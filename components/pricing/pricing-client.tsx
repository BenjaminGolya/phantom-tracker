"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2, X } from "lucide-react";
import { GhostMark } from "@/components/brand/ghost-mark";
import { PLAN_LIMITS, PRICE_LABEL, PRICE_LABEL_YEARLY, YEARLY_SAVINGS_PCT, TRIAL_DAYS } from "@/lib/plan";

type Interval = "monthly" | "yearly";

const FREE_FEATURES: { label: string; included: boolean }[] = [
  { label: `Up to ${PLAN_LIMITS.freeHabitLimit} habits`, included: true },
  { label: "Daily tracking & streaks", included: true },
  { label: "Contribution calendars", included: true },
  { label: `Profile levels (up to Lv.${PLAN_LIMITS.freeProfileLevelCap})`, included: true },
  { label: "Timed push reminders", included: false },
  { label: "Advanced stats", included: false },
  { label: `${PLAN_LIMITS.proXpMultiplier}× XP boost`, included: false },
  { label: "Exclusive elite tiers", included: false },
];

const PRO_FEATURES: string[] = [
  "Unlimited habits",
  "Timed push reminders",
  "Advanced stats & insights",
  `${PLAN_LIMITS.proXpMultiplier}× XP boost on everything`,
  "Exclusive tiers 🌌 ✴️ ♾️ (uncapped levels)",
  "Daily tracking, streaks & calendars",
  "Priority support",
];

export function PricingClient({ pro, trialEligible = false }: { pro: boolean; trialEligible?: boolean }) {
  const params = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<Interval>("yearly");

  async function upgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        data?.message ??
          (data?.error === "billing_unavailable"
            ? "Billing isn't set up yet — check back soon."
            : "Couldn't start checkout. Please try again.")
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 lg:pb-6">
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 mb-3">
          <GhostMark size={24} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Go Pro</h1>
        <p className="text-sm text-muted mt-1">
          Unlock unlimited habits, reminders, advanced stats and a faster path to the top.
        </p>
        {!pro && trialEligible && (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-medium text-primary">
            <Sparkles size={12} /> Start with a {TRIAL_DAYS}-day free trial — cancel anytime
          </div>
        )}
      </div>

      {canceled && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-surface text-xs text-muted">
          <X size={13} /> Checkout canceled — no charge was made.
        </div>
      )}
      {error && (
        <div className="px-3.5 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Billing interval toggle */}
      {!pro && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                interval === "monthly" ? "bg-surface-2 text-white" : "text-muted hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                interval === "yearly" ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
              }`}
            >
              Yearly
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                SAVE {YEARLY_SAVINGS_PCT}%
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted font-medium mb-1">Free</p>
          <p className="text-3xl font-bold mb-4">€0<span className="text-sm text-muted font-normal"> / mo</span></p>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                {f.included ? (
                  <Check size={15} className="text-green-400 shrink-0" />
                ) : (
                  <X size={15} className="text-muted/50 shrink-0" />
                )}
                <span className={f.included ? "text-white" : "text-muted line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>
          {!pro && (
            <div className="mt-5 text-center text-xs text-muted py-2 border border-border rounded-lg">
              Your current plan
            </div>
          )}
        </div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-surface border-2 border-primary/50 rounded-2xl p-5 shadow-[0_0_40px_#7f49c320]"
        >
          <span className="absolute -top-2.5 right-4 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary text-white">
            BEST VALUE
          </span>
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-1 flex items-center gap-1">
            <Sparkles size={12} /> Pro
          </p>
          <div className="mb-4">
            {interval === "yearly" ? (
              <>
                <p className="text-3xl font-bold">
                  €15<span className="text-sm text-muted font-normal"> / yr</span>
                </p>
                <p className="text-[11px] text-primary mt-0.5">≈ €1.25/mo · billed yearly · save {YEARLY_SAVINGS_PCT}%</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">
                  €2<span className="text-sm text-muted font-normal"> / mo</span>
                </p>
                <p className="text-[11px] text-muted mt-0.5">billed monthly</p>
              </>
            )}
          </div>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check size={15} className="text-primary shrink-0" />
                <span className="text-white">{f}</span>
              </li>
            ))}
          </ul>

          {pro ? (
            <div className="mt-5 text-center text-xs text-primary py-2.5 border border-primary/40 bg-primary/10 rounded-lg font-medium">
              ✦ You&apos;re on Pro — thank you!
            </div>
          ) : (
            <button
              onClick={upgrade}
              disabled={loading}
              className="mt-5 w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all hover:shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {trialEligible
                ? `Start ${TRIAL_DAYS}-day free trial`
                : `Upgrade — ${interval === "yearly" ? PRICE_LABEL_YEARLY : PRICE_LABEL}`}
            </button>
          )}
          <p className="text-[10px] text-muted text-center mt-2">
            {trialEligible
              ? `Free for ${TRIAL_DAYS} days, then ${interval === "yearly" ? PRICE_LABEL_YEARLY : PRICE_LABEL} · cancel anytime`
              : "Cancel anytime · secure checkout via Stripe"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
