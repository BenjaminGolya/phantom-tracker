"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Star, Wrench, ArrowUpRight } from "lucide-react";
import { CHANGELOG, type ChangelogEntry } from "@/lib/version";
import { useT } from "@/lib/i18n/context";

const STORAGE_KEY = "pt:whatsNewSeen";

const KIND_META = {
  feature: { icon: Sparkles, cls: "bg-primary/15 text-primary border-primary/30" },
  improvement: { icon: Star, cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  fix: { icon: Wrench, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
} as const;

// Entries the user can see (admin-only changes are excluded).
function publicEntries(): ChangelogEntry[] {
  return CHANGELOG.filter((e) => !e.admin);
}

export function WhatsNewModal({ version }: { version: string }) {
  const t = useT();
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);

  useEffect(() => {
    let seen: string | null = null;
    try { seen = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }

    const pub = publicEntries();

    if (seen === version) return; // already caught up on this version

    // What to show:
    //  • first-time visitor (no record) or unknown record → the latest updates
    //  • returning visitor → everything newer than what they last saw
    //    (CHANGELOG is newest-first, so that's the slice above their version)
    let fresh: ChangelogEntry[];
    if (!seen) {
      fresh = pub.slice(0, 4);
    } else {
      const seenIdx = pub.findIndex((e) => e.version === seen);
      fresh = seenIdx === -1 ? pub.slice(0, 4) : pub.slice(0, seenIdx);
    }
    if (!fresh.length) {
      try { localStorage.setItem(STORAGE_KEY, version); } catch { /* ignore */ }
      return;
    }
    // Major updates first, then by recency (already recency-ordered).
    setEntries([...fresh].sort((a, b) => Number(!!b.major) - Number(!!a.major)));
  }, [version]);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, version); } catch { /* ignore */ }
    setEntries(null);
  }

  return (
    <AnimatePresence>
      {entries && entries.length > 0 && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-10 max-h-[85dvh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-4 border-b border-border overflow-hidden shrink-0">
              <div className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">
                    <Sparkles size={11} /> {t("whatsNew.tag")}
                  </span>
                  <h2 className="text-lg font-bold leading-tight">{t("whatsNew.title")}</h2>
                  <p className="text-xs text-muted mt-0.5">{t("whatsNew.subtitle")}</p>
                </div>
                <button onClick={dismiss} aria-label={t("common.cancel")} className="text-muted hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Entries */}
            <div className="overflow-y-auto px-5 py-4 space-y-3">
              {entries.map((e) => {
                const meta = KIND_META[e.kind];
                const Icon = meta.icon;
                return (
                  <div
                    key={e.version}
                    className={`flex gap-3 p-3 rounded-xl border ${e.major ? "border-primary/30 bg-primary/5" : "border-border bg-surface-2/40"}`}
                  >
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${meta.cls}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {e.major && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                            {t("whatsNew.major")}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted">v{e.version}</span>
                      </div>
                      <p className="text-sm text-white/90 leading-snug">{e.summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
              <Link
                href="/settings#changelog"
                onClick={dismiss}
                className="text-xs text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {t("whatsNew.viewAll")} <ArrowUpRight size={12} />
              </Link>
              <button
                onClick={dismiss}
                className="px-4 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("whatsNew.gotIt")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
