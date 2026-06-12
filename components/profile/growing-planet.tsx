"use client";

import { motion } from "framer-motion";
import { useMemo, useId } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { planetState, type PlanetState, type PlanetStatus, type TraitHabit } from "@/lib/profile-traits";

const ACCENT = "#7f49c3";

const STATUS_COLOR: Record<PlanetStatus, string> = {
  radiant: "#34d399",
  thriving: "#46b06a",
  flourishing: "#5cb866",
  healthy: "#7fae5a",
  steady: "#a8c24d",
  stable: "#d4c24a",
  wilting: "#e0a04b",
  struggling: "#c2845b",
  fading: "#a8a29e",
  dormant: "#9ca3af",
};

type Blob = { x: number; y: number; r: number };

// Small seeded PRNG so each user gets their own (but stable) land shape.
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Per-user random continents: 2–4 landmasses, each a cluster of overlapping
// blobs (read as soft continents). Clipped to the globe, so blobs may spill
// past the edge. Deterministic for a given `seed`.
function continents(R: number, seed = 1): Blob[] {
  const rnd = mulberry32(seed || 1);
  const masses = 2 + Math.floor(rnd() * 3);
  const out: Blob[] = [];
  for (let m = 0; m < masses; m++) {
    const ang = rnd() * Math.PI * 2;
    const dist = (0.12 + rnd() * 0.42) * R;
    const mx = Math.cos(ang) * dist;
    const my = Math.sin(ang) * dist;
    const blobs = 2 + Math.floor(rnd() * 3);
    for (let b = 0; b < blobs; b++) {
      out.push({
        x: mx + (rnd() - 0.5) * R * 0.34,
        y: my + (rnd() - 0.5) * R * 0.34,
        r: R * (0.15 + rnd() * 0.17),
      });
    }
  }
  return out;
}

// Deterministically scatter trees INSIDE the continents (never on ocean).
function treePositions(count: number, radius: number, seed = 1) {
  const blobs = continents(radius, seed);
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

// Presentational planet - renders any PlanetState. Reused by the profile and by
// the landing-page examples. Unique SVG ids per instance so multiple planets can
// coexist on one page without clipPath/gradient collisions.
export function PlanetVisual({ state: p }: { state: PlanetState }) {
  const uid = useId().replace(/[:]/g, "");
  const id = (k: string) => `${k}-${uid}`;
  const seed = p.seed ?? 1;
  const blobs = useMemo(() => continents(p.radius, seed), [p.radius, seed]);
  const trees = useMemo(() => treePositions(p.totalTrees, p.radius, seed), [p.totalTrees, p.radius, seed]);
  const hue = 28 + 92 * p.vitality;
  const land = `hsl(${hue}, ${24 + p.vitality * 46}%, ${28 + p.vitality * 12}%)`;

  return (
    <svg viewBox="0 0 240 220" className="w-full max-w-[400px]">
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
        {p.diamond && (
          <>
            <linearGradient id={id("aurora")} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#67e8f900" />
              <stop offset="22%" stopColor="#67e8f9" />
              <stop offset="45%" stopColor="#a78bfa" />
              <stop offset="68%" stopColor="#5eead4" />
              <stop offset="86%" stopColor="#f0abfc" />
              <stop offset="100%" stopColor="#67e8f900" />
            </linearGradient>
            <radialGradient id={id("auroraBloom")} cx="50%" cy="100%" r="75%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.5" />
              <stop offset="42%" stopColor="#a78bfa" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={id("auroraCurtain")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
              <stop offset="32%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
            </linearGradient>
            <filter id={id("auroraBlur")} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.4" /></filter>
            <filter id={id("auroraSoft")} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.5" /></filter>
          </>
        )}
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
            {blobs.map((b, i) => (
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

      {/* Diamond-exclusive aurora - a glowing crown of light over the world */}
      {p.diamond && (() => {
        const cx = 120, cy = 108, R = p.radius;
        const baseY = cy - R * 0.05;           // where bands meet the horizon
        const arcTop = (f: number) => cy - (R + 6) - Math.sin(f * Math.PI) * 22; // bowed-up top edge
        return (
          <g>
            {/* Soft bloom halo crowning the planet */}
            <motion.ellipse
              cx={cx} cy={cy - R * 0.35} rx={R * 1.55} ry={R * 0.95}
              fill={`url(#${id("auroraBloom")})`} filter={`url(#${id("auroraBlur")})`}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 0.7, 0.45, 0.65, 0.35] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Curtain rays hanging from the crown */}
            <g filter={`url(#${id("auroraSoft")})`}>
              {Array.from({ length: 13 }).map((_, i) => {
                const f = i / 12;
                const x = cx - (R + 4) + f * (R + 4) * 2;
                const top = arcTop(f);
                const len = 16 + Math.sin(f * Math.PI) * 26;
                return (
                  <motion.rect
                    key={`cr${i}`}
                    x={x - 1} y={top} width={2} height={len} rx={1}
                    fill={`url(#${id("auroraCurtain")})`}
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.15, 0.85, 0.3, 0.7, 0.15], scaleY: [0.85, 1.12, 0.92, 1.05, 0.85] }}
                    transition={{ duration: 3.4 + (i % 5) * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.16 }}
                    style={{ transformOrigin: `${x}px ${top}px` }}
                  />
                );
              })}
            </g>

            {/* Bright arcing bands */}
            <g filter={`url(#${id("auroraBlur")})`}>
              {[0, 1, 2, 3, 4].map((k) => {
                const lift = R + 12 + k * 9;
                const span = R + 12 + k * 6;
                return (
                  <motion.path
                    key={`au${k}`}
                    d={`M ${cx - span} ${baseY} Q ${cx} ${cy - lift} ${cx + span} ${baseY}`}
                    fill="none"
                    stroke={`url(#${id("aurora")})`}
                    strokeWidth={3.6 - k * 0.5}
                    strokeLinecap="round"
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 0.75, 0.35, 0.6, 0.2] }}
                    transition={{ duration: 4.2 + k * 1.1, repeat: Infinity, ease: "easeInOut", delay: k * 0.45 }}
                  />
                );
              })}
            </g>
          </g>
        );
      })()}

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

export function GrowingPlanet({ habits, pro, diamond = false, seed = 1 }: { habits: TraitHabit[]; pro: boolean; diamond?: boolean; seed?: number }) {
  const { t } = useLang();
  const p = useMemo(() => planetState(habits, { isPro: pro, isDiamond: diamond, seed }), [habits, pro, diamond, seed]);
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
