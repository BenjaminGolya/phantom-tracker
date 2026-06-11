"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2, X, Gem } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { PLAN_LIMITS, YEARLY_SAVINGS_PCT, TRIAL_DAYS } from "@/lib/plan";

type Interval = "monthly" | "yearly" | "lifetime";
export type CurrentPlan = "free" | "monthly" | "yearly" | "lifetime" | "pro";

const FREE_FEATURES: string[] = [
  `Up to ${PLAN_LIMITS.freeHabitLimit} habits`,
  "Daily tracking & streaks",
  "Contribution calendars",
  `Profile levels (to Lv.${PLAN_LIMITS.freeProfileLevelCap})`,
];

const PRO_FEATURES: string[] = [
  "Unlimited habits",
  "Timed push reminders",
  "Advanced stats & insights",
  `${PLAN_LIMITS.proXpMultiplier}× XP boost on everything`,
  "Exclusive tiers 🌌 ✴️ ♾️ (uncapped levels)",
  "Priority support",
];

type Tile = {
  key: Exclude<CurrentPlan, "pro">;
  name: string;
  price: string;
  per: string;
  tag?: { text: string; cls: string };
  blurb: string;
  diamond?: boolean;
};

const TILES: Tile[] = [
  { key: "free", name: "Free", price: "€0", per: "forever", blurb: "The essentials, free on every device." },
  { key: "monthly", name: "Pro Monthly", price: "€2", per: "/ mo", blurb: "All Pro features, billed monthly." },
  { key: "yearly", name: "Pro Yearly", price: "€15", per: "/ yr", tag: { text: `SAVE ${YEARLY_SAVINGS_PCT}%`, cls: "bg-primary/20 text-primary" }, blurb: "All Pro features — best value." },
  { key: "lifetime", name: "Diamond", price: "€29", per: "once", tag: { text: "SOON", cls: "bg-cyan-400/20 text-cyan-300" }, blurb: "Pay once, Pro forever.", diamond: true },
];

export function PricingClient({
  pro,
  trialEligible = false,
  hasBilling = false,
  currentPlan = "free",
}: {
  pro: boolean;
  trialEligible?: boolean;
  hasBilling?: boolean;
  currentPlan?: CurrentPlan;
}) {
  const params = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const [loading, setLoading] = useState<Interval | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade(interval: Interval) {
    setLoading(interval);
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
            ? "Billing isn't set up yet. Please check back soon."
            : "Couldn't start checkout. Please try again.")
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.message ?? "Couldn't open the billing portal. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  // Treat unknown-interval comp Pro as matching the monthly card.
  const isCurrent = (key: Tile["key"]) =>
    currentPlan === key || (currentPlan === "pro" && key === "monthly");

  function renderAction(t: Tile) {
    if (isCurrent(t.key)) {
      return (
        <div className="mt-4 space-y-2">
          <div className="text-center text-xs text-primary py-2 border border-primary/40 bg-primary/10 rounded-lg font-medium">
            ✦ Current plan
          </div>
          {t.key !== "free" && hasBilling && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full py-2 border border-border hover:border-primary/40 text-xs font-medium text-muted hover:text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {portalLoading && <Loader2 size={13} className="animate-spin" />}
              Manage or cancel
            </button>
          )}
        </div>
      );
    }

    if (t.key === "lifetime") {
      return (
        <div className="mt-4 w-full py-2 text-center text-xs font-semibold text-muted border border-border bg-surface-2 rounded-lg cursor-not-allowed">
          Coming soon
        </div>
      );
    }

    if (t.key === "free") {
      // Shown to Pro users — downgrading happens by cancelling.
      return <div className="mt-4 text-[11px] text-muted text-center">Cancel Pro to return to Free.</div>;
    }

    // Paid Pro tile (monthly/yearly) that isn't the current plan.
    if (pro) {
      // Already Pro on a different interval — switch via the billing portal.
      return hasBilling ? (
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="mt-4 w-full py-2 border border-border hover:border-primary/40 text-xs font-medium text-muted hover:text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {portalLoading && <Loader2 size={13} className="animate-spin" />}
          Switch in billing portal
        </button>
      ) : null;
    }

    // Free user upgrading.
    return (
      <button
        onClick={() => upgrade(t.key as Interval)}
        disabled={loading !== null}
        className="mt-4 w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all hover:shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading === t.key ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {trialEligible ? `Start ${TRIAL_DAYS}-day trial` : "Choose"}
      </button>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 lg:pb-6">
      <div className="text-center pt-2">
        <GhostLogo size={48} rounded="rounded-2xl" className="mb-3 mx-auto" />
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-sm text-muted mt-1">
          {pro ? "You're on Pro — manage your plan below." : "Start free. Upgrade when you want more."}
        </p>
        {!pro && trialEligible && (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-medium text-primary">
            <Sparkles size={12} /> Start with a {TRIAL_DAYS}-day free trial, cancel anytime
          </div>
        )}
      </div>

      {canceled && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-surface text-xs text-muted">
          <X size={13} /> Checkout canceled. No charge was made.
        </div>
      )}
      {error && (
        <div className="px-3.5 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* All plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TILES.map((t) => {
          const current = isCurrent(t.key);
          return (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl p-5 border-2 transition-colors ${
                current
                  ? "border-primary/60 bg-surface shadow-[0_0_30px_#7f49c320]"
                  : t.diamond
                    ? "border-cyan-400/45 shadow-[0_0_30px_#38bdf81f]"
                    : "border-border bg-surface"
              }`}
              style={t.diamond && !current ? { background: "linear-gradient(160deg,#38bdf80f,#818cf80a,var(--surface,#111))" } : undefined}
            >
              {t.tag && !current && (
                <span className={`absolute -top-2.5 right-4 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md ${t.tag.cls}`}>
                  {t.tag.text}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <p
                  className={`text-xs uppercase tracking-widest font-medium flex items-center gap-1 ${t.diamond ? "" : "text-muted"}`}
                  style={t.diamond ? { color: "#67e8f9" } : undefined}
                >
                  {t.diamond && <Gem size={12} />}
                  {t.name}
                </p>
              </div>
              <p className="text-3xl font-bold mt-1">
                {t.price}<span className="text-sm text-muted font-normal"> {t.per}</span>
              </p>
              <p className="text-xs text-muted mt-1.5 min-h-[2rem]">{t.blurb}</p>

              {t.key === "free" && (
                <ul className="mt-3 space-y-1.5">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/90">
                      <Check size={13} className="text-green-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}

              {renderAction(t)}
            </motion.div>
          );
        })}
      </div>

      {/* What Pro includes */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3 flex items-center gap-1">
          <Sparkles size={12} /> Every Pro plan includes
        </p>
        <ul className="grid sm:grid-cols-2 gap-2.5">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check size={15} className="text-primary shrink-0" />
              <span className="text-white">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted text-center">
        {pro
          ? "If you cancel, Pro stays active until the end of your billing period, then you move to Free."
          : "Secure checkout via Stripe · cancel anytime."}
      </p>
    </div>
  );
}
