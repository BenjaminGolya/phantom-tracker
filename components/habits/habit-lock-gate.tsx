"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, Check, Sparkles, Loader2 } from "lucide-react";
import { getHabitIcon } from "@/lib/habit-icons";
import { PLAN_LIMITS, isOverFreeLimit } from "@/lib/plan";
import { useLang } from "@/lib/i18n/context";
import { categoryLabel } from "@/lib/i18n/category";

export type GateHabit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string | null;
  archived: boolean;
  locked: boolean;
};

// Hard-block shown on first login after Pro expires while over the free limit:
// the user must pick which habits to keep active. The rest are locked (kept
// safe, hidden behind Pro). Nothing is deleted.
export function HabitLockGate({ habits, pro }: { habits: GateHabit[]; pro: boolean }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const limit = PLAN_LIMITS.freeHabitLimit;
  const visible = habits.filter((h) => !h.archived);

  // Pre-select the first `limit` habits (oldest first) as a sensible default.
  const [keep, setKeep] = useState<Set<string>>(
    () => new Set(visible.slice(0, limit).map((h) => h.id))
  );
  const [saving, setSaving] = useState(false);

  // Don't block the upgrade flow - let the user reach pricing.
  if (pathname?.startsWith("/pricing")) return null;
  if (!isOverFreeLimit(habits, pro)) return null;

  const atCap = keep.size >= limit;

  function toggle(id: string) {
    setKeep((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < limit) next.add(id);
      return next;
    });
  }

  async function confirm() {
    setSaving(true);
    const res = await fetch("/api/habits/keep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepIds: Array.from(keep) }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-5 z-10 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock size={16} className="text-primary" />
          <h2 className="text-base font-bold">{t("lock.title")}</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-1">
          {t("lock.body1").replace("{limit}", String(limit))}
        </p>
        <p className="text-xs text-muted leading-relaxed mb-4">{t("lock.body2")}</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-muted">{t("lock.keepLabel")}</span>
          <span className="text-xs font-mono font-semibold" style={{ color: keep.size > limit ? "#ef4444" : undefined }}>
            {keep.size}/{limit}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {visible.map((h) => {
            const HabitIcon = getHabitIcon(h.icon);
            const selected = keep.has(h.id);
            const disabled = !selected && atCap;
            return (
              <button
                key={h.id}
                onClick={() => toggle(h.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  selected ? "border-primary/60 bg-primary/10" : "border-border hover:border-border/80"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span style={{ color: h.color }} className="shrink-0"><HabitIcon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{h.name}</p>
                  {h.category && <p className="text-[11px] text-muted truncate">{categoryLabel(h.category, lang)}</p>}
                </div>
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    selected ? "bg-primary border-primary text-white" : "border-border"
                  }`}
                >
                  {selected && <Check size={13} />}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={confirm}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {t("lock.confirm")}
        </button>

        <Link
          href="/pricing"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Sparkles size={12} /> {t("lock.upgradeInstead")}
        </Link>
      </div>
    </div>
  );
}
