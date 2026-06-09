"use client";

import { motion } from "framer-motion";
import { PlanetVisual } from "@/components/profile/growing-planet";
import type { PlanetState } from "@/lib/profile-traits";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";

// Hand-crafted example worlds for the public landing page (no real data).
const EXAMPLES: { labelKey: DictKey; state: PlanetState }[] = [
  {
    labelKey: "lp.worldStart",
    state: { level: 2, xp: 35, radius: 38, hasRing: false, moons: 0, totalTrees: 2, healthyTrees: 2, vitality: 0.55, neglectDays: 0, messy: 0, lush: 0.25, status: "healthy" },
  },
  {
    labelKey: "lp.worldThriving",
    state: { level: 9, xp: 320, radius: 66, hasRing: true, moons: 2, totalTrees: 12, healthyTrees: 12, vitality: 0.95, neglectDays: 0, messy: 0, lush: 0.95, status: "thriving" },
  },
  {
    labelKey: "lp.worldNeglected",
    state: { level: 9, xp: 320, radius: 66, hasRing: true, moons: 2, totalTrees: 12, healthyTrees: 3, vitality: 0.25, neglectDays: 14, messy: 0.7, lush: 0.2, status: "neglected" },
  },
];

export function WorldExamples() {
  const { t } = useLang();
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {EXAMPLES.map((ex, i) => (
        <motion.div
          key={ex.labelKey}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center"
        >
          <div className="w-full" style={{ perspective: 700 }}>
            <PlanetVisual state={ex.state} />
          </div>
          <span className="mt-2 text-xs font-medium text-muted">{t(ex.labelKey)}</span>
        </motion.div>
      ))}
    </div>
  );
}
