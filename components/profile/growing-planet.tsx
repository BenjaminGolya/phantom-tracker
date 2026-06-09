"use client";

import { motion } from "framer-motion";
import { useMemo, useId } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { planetState, type PlanetState, type PlanetStatus, type TraitHabit } from "@/lib/profile-traits";

const ACCENT = "#7f49c3";

const STATUS_COLOR: Record<PlanetStatus, string> = {
  thriving: "#46b06a",
  healthy: "#7fae5a",
  wilting: "#e0a04b",
  neglected: "#9ca3af",
};

type Blob = { x: number; y: number; r: number };

// Two landmasses, each made of a few overlapping circles (read as blobby
// continents once softened). Coordinates are local to the planet centre.
function continents(R: number): Blob[] {
  return [
    { x: -0.30 * R, y: -0.06 * R, r: 0.30 * R },
    { x: -0.12 * R, y: -0.24 * R, r: 0.20 * R },
    { x: -0.40 * R, y: 0.16 * R, r: 0.17 * R },
    { x: 0.26 * R, y: 0.22 * R, r: 0.26 * R },
    { x: 0.42 * R, y: 0.30 * R, r: 0.15 * R },
  ];
}

// Deterministically scatter trees INSIDE the continents (never on ocean).
function treePositions(count: number, radius: number) {
  const blobs = continents(radius);
  const totalArea = blobs.reduce((s, b) => s + b.r * b.r, 0);
  const out: { x: number; y: number; s: number }[] = [];
  let placed = 0;
  blobs.forEach((b, bi) => {
    const share = bi === blobs.length - 1
      ? count - placed
      : Math.round((count * (b.r * b.r)) / totalArea);
    for (let j = 0; j < share && placed < count; j++) {
      const ang = placed * 2.399963; // golden angle
      const rr = b.r * 0.62 * Math.sqrt((j + 0.5) / Math.max(1, share));
      out.push({
        x: b.x + Math.cos(ang) * rr,
        y: b.y + Math.sin(ang) * rr,
        s: 0.7 + ((placed * 37) % 50) / 100,
      });
      placed++;
    }
  });
  return out;
}

// Presentational planet — renders any PlanetState. Reused by the profile and by
// the landing-page examples. Unique SVG ids per instance so multiple planets can
// coexist on one page without clipPath/gradient collisions.
export function PlanetVisual({ state: p }: { state: PlanetState }) {
  const uid = useId().replace(/[:]/g, "");
  const id = (k: string) => `${k}-${uid}`;
  const trees = useMemo(() => treePositions(p.totalTrees, p.radius), [p.totalTrees, p.radius]);
  const hue = 28 + 92 * p.vitality;
  const land = `hsl(${hue}, ${24 + p.vitality * 46}%, ${28 + p.vitality * 12}%)`;

  return (
    <svg viewBox="0 0 240 220" className="w-full max-w-[320px]">
      <defs>
        <radialGradient id={id("atmo")} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={`${ACCENT}00`} />
          <stop offset="92%" stopColor={`${ACCENT}55`} />
          <stop offset="100%" stopColor={`${ACCENT}00`} />
        </radialGradient>
        <radialGradient id={id("globe")} cx="36%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#bfe9ff" />
          <stop offset="45%" stopColor="#3a7bd5" />
          <stop offset="100%" stopColor="#0c1230" />
        </radialGradient>
        <radialGradient id={id("shade")} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#00000000" />
          <stop offset="100%" stopColor="#000000aa" />
        </radialGradient>
        <clipPath id={id("clip")}><circle cx={120} cy={108} r={p.radius} /></clipPath>
        <filter id={id("coast")}><feGaussianBlur stdDeviation="1.1" /></filter>
      </defs>

      {/* twinkling stars */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 53) % 240, y = (i * 89) % 220;
        return (
          <motion.circle key={i} cx={x} cy={y} r={(i % 3) * 0.4 + 0.5} fill="#ffffff"
            initial={{ opacity: 0.15 }} animate={{ opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }} />
        );
      })}

      <circle cx={120} cy={108} r={p.radius + 16} fill={`url(#${id("atmo")})`} opacity={0.4 + 0.6 * p.vitality} />

      {p.hasRing && (
        <g transform="translate(120 108) rotate(-18)">
          <ellipse cx={0} cy={0} rx={p.radius + 30} ry={(p.radius + 30) * 0.28} fill="none" stroke={`${ACCENT}aa`} strokeWidth={3} />
          <ellipse cx={0} cy={0} rx={p.radius + 22} ry={(p.radius + 22) * 0.28} fill="none" stroke={`${ACCENT}40`} strokeWidth={1.5} />
        </g>
      )}

      <circle cx={120} cy={108} r={p.radius} fill={`url(#${id("globe")})`} />

      <motion.g
        style={{ transformOrigin: "120px 108px" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        clipPath={`url(#${id("clip")})`}
      >
        <g transform="translate(120 108)">
          <g filter={`url(#${id("coast")})`}>
            {continents(p.radius).map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={land} />
            ))}
          </g>

          {trees.map((tp, i) => {
            const healthy = i < p.healthyTrees;
            const r = 2.1 * tp.s;
            return (
              <g key={i} transform={`translate(${tp.x} ${tp.y})`}>
                <rect x={-0.6} y={r * 0.4} width={1.2} height={r * 1.2} fill="#5b3d22" />
                {healthy ? (
                  <circle cx={0} cy={-r * 0.3} r={r} fill={`hsl(${hue}, 58%, 42%)`} />
                ) : (
                  <circle cx={0} cy={-r * 0.2} r={r * 0.7} fill="#6b5836" opacity={0.75} />
                )}
              </g>
            );
          })}

          {p.vitality > 0.7 && trees.slice(0, 5).map((tp, i) => (
            <circle key={`f${i}`} cx={tp.x + 3} cy={tp.y + 2} r={1}
              fill={["#f6c945", "#ef6f9e", "#fff"][i % 3]} />
          ))}
        </g>
      </motion.g>

      <circle cx={120} cy={108} r={p.radius} fill={`url(#${id("shade")})`} />

      {p.messy > 0.05 && (
        <g clipPath={`url(#${id("clip")})`}>
          <circle cx={120} cy={108} r={p.radius} fill="#9aa6b2" opacity={0.28 * p.messy} />
          {[0, 1, 2].map((i) => (
            <motion.ellipse
              key={i} cy={92 + i * 14} rx={p.radius * 0.7} ry={6} fill="#e8edf2" opacity={0.18 * p.messy}
              initial={{ cx: 70 }} animate={{ cx: [70, 170, 70] }}
              transition={{ duration: 14 + i * 6, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </g>
      )}

      {Array.from({ length: p.moons }).map((_, i) => (
        <motion.g key={i} style={{ transformOrigin: "120px 108px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14 + i * 9, repeat: Infinity, ease: "linear" }}>
          <circle cx={120 + (p.radius + 26 + i * 10)} cy={108} r={4 + i} fill="#cbd5e1"
            style={{ filter: "drop-shadow(0 0 4px #cbd5e1)" }} />
        </motion.g>
      ))}
    </svg>
  );
}

export function GrowingPlanet({ habits, pro }: { habits: TraitHabit[]; pro: boolean }) {
  const { t } = useLang();
  const p = useMemo(() => planetState(habits, { isPro: pro }), [habits, pro]);
  const statusColor = STATUS_COLOR[p.status];

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">{t("prof.planetTitle")}</h2>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
            style={{ color: statusColor, borderColor: `${statusColor}55`, background: `${statusColor}18` }}
          >
            {t(`prof.status.${p.status}` as DictKey)}
          </span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
            {t("prof.lvl")}{p.level}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center py-2" style={{ perspective: 700 }}>
        <PlanetVisual state={p} />
      </div>

      <p className="text-xs text-muted text-center">{t("prof.planetSub")}</p>

      <details className="group mt-4 border-t border-border pt-3">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none group/sum">
          <span className="text-xs font-medium transition-colors text-muted group-hover/sum:text-primary">
            {t("prof.growTitle")}
          </span>
          <ChevronDown size={15} className="text-muted transition-all group-open:rotate-180 group-hover/sum:text-primary" />
        </summary>
        <ul className="mt-3 space-y-2">
          {(["prof.grow1", "prof.grow2", "prof.grow3", "prof.grow4", "prof.grow5", "prof.grow6"] as const).map((k) => (
            <li key={k} className="flex gap-2 text-xs text-muted leading-relaxed">
              <span className="text-primary mt-px">•</span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
