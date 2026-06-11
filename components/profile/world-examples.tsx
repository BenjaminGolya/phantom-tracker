"use client";

import { motion } from "framer-motion";
import { Gem } from "lucide-react";
import { PlanetVisual } from "@/components/profile/growing-planet";
import type { PlanetState } from "@/lib/profile-traits";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";

// Hand-crafted example worlds for the public landing page (no real data).
// Each `seed` gives a distinct landmass; the final one is the Diamond world.
type Example = { labelKey: DictKey; state: PlanetState; diamond?: boolean };

const EXAMPLES: Example[] = [
  {
    labelKey: "lp.worldStart",
    state: { level: 2, xp: 30, radius: 46, hasRing: false, moons: 0, totalTrees: 2, healthyTrees: 2, vitality: 0.45, neglectDays: 0, messy: 0, lush: 0.2, status: "stable", seed: 3 },
  },
  {
    labelKey: "lp.worldGrowing",
    state: { level: 4, xp: 120, radius: 53, hasRing: false, moons: 1, totalTrees: 5, healthyTrees: 4, vitality: 0.66, neglectDays: 0, messy: 0, lush: 0.4, status: "steady", seed: 11 },
  },
  {
    labelKey: "lp.worldRinged",
    state: { level: 6, xp: 280, radius: 60, hasRing: true, moons: 1, totalTrees: 8, healthyTrees: 7, vitality: 0.72, neglectDays: 0, messy: 0, lush: 0.6, status: "healthy", seed: 5 },
  },
  {
    labelKey: "lp.worldThriving",
    state: { level: 10, xp: 700, radius: 74, hasRing: true, moons: 2, totalTrees: 13, healthyTrees: 13, vitality: 0.96, neglectDays: 0, messy: 0, lush: 0.95, status: "radiant", seed: 8 },
  },
  {
    labelKey: "lp.worldNeglected",
    state: { level: 10, xp: 700, radius: 74, hasRing: true, moons: 2, totalTrees: 13, healthyTrees: 3, vitality: 0.22, neglectDays: 14, messy: 0.7, lush: 0.2, status: "fading", seed: 8 },
  },
  {
    labelKey: "lp.worldDiamond",
    diamond: true,
    state: { level: 14, xp: 2200, radius: 81, hasRing: true, moons: 2, totalTrees: 14, healthyTrees: 14, vitality: 1, neglectDays: 0, messy: 0, lush: 1, status: "radiant", seed: 21, diamond: true },
  },
];

export function WorldExamples() {
  const { t } = useLang();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {EXAMPLES.map((ex, i) => (
        <motion.div
          key={ex.labelKey}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: i * 0.07 }}
          className={`relative rounded-2xl p-4 flex flex-col items-center transition-colors ${
            ex.diamond
              ? "border-2 border-cyan-400/45 shadow-[0_0_34px_#67e8f922]"
              : "bg-surface border border-border"
          }`}
          style={ex.diamond ? { background: "linear-gradient(165deg,#67e8f90f,#818cf80a,var(--surface,#111))" } : undefined}
        >
          {ex.diamond && (
            <span
              className="absolute -top-2.5 right-4 inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md border"
              style={{ background: "#67e8f91a", borderColor: "#67e8f966", color: "#67e8f9" }}
            >
              <Gem size={9} /> {t("lp.worldDiamondTag")}
            </span>
          )}
          <div className="w-full" style={{ perspective: 700 }}>
            <PlanetVisual state={ex.state} />
          </div>
          <span className={`mt-2 text-xs font-medium ${ex.diamond ? "" : "text-muted"}`} style={ex.diamond ? { color: "#67e8f9" } : undefined}>
            {t(ex.labelKey)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
