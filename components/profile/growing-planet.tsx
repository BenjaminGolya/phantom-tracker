"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useId, useState } from "react";
import { ChevronDown, X } from "lucide-react";
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

// Best to worst, with the vitality threshold (%) each one needs. Mirrors the
// bands in planetState().
const STATUS_LADDER: { key: PlanetStatus; min: number }[] = [
  { key: "radiant", min: 92 },
  { key: "thriving", min: 84 },
  { key: "flourishing", min: 76 },
  { key: "healthy", min: 68 },
  { key: "steady", min: 60 },
  { key: "stable", min: 52 },
  { key: "wilting", min: 42 },
  { key: "struggling", min: 32 },
  { key: "fading", min: 22 },
  { key: "dormant", min: 0 },
];

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

// Per-user continents revealed progressively by level. A fixed pool of
// landmasses is generated deterministically from `seed` (positions stay stable
// per user); `amount` (0..1, grows with level) reveals more of them and nudges
// their size. Clustered + capped so there is ALWAYS open ocean.
const LAND_POOL = 6;
// Continents live on a horizontal "strip" (longitude x in [0, 2R), latitude y
// in roughly [-0.45R, 0.45R]). The strip scrolls under the clipped globe, so
// land and ocean rotate past the limb. A stable per-user pool is revealed
// progressively by level; clustered + capped so open ocean always remains.
function continents(R: number, seed = 1, amount = 0.5): Blob[] {
  const rnd = mulberry32(seed || 1);
  const visible = Math.max(1, Math.round(1 + amount * (LAND_POOL - 1))); // 1..6
  const sizeScale = 0.8 + amount * 0.5;
  const W = R * 2;                            // strip width = one full rotation
  const out: Blob[] = [];
  for (let m = 0; m < LAND_POOL; m++) {
    // Always consume the same RNG sequence so the pool stays stable as the
    // visible count changes with level.
    const lon = rnd() * W;                    // longitude across the strip
    const lat = (rnd() - 0.5) * R * 0.9;      // latitude (avoid the poles)
    const nBlobs = 2 + Math.floor(rnd() * 3);
    const masses: Blob[] = [];
    for (let b = 0; b < nBlobs; b++) {
      masses.push({
        x: lon + (rnd() - 0.5) * R * 0.4,
        y: lat + (rnd() - 0.5) * R * 0.3,
        r: R * (0.1 + rnd() * 0.15) * sizeScale,
      });
    }
    if (m < visible) out.push(...masses);
  }
  return out;
}

// Deterministically scatter trees INSIDE the continents (never on ocean).
function treePositions(count: number, radius: number, seed = 1, amount = 0.5) {
  const blobs = continents(radius, seed, amount);
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
  // Land grows with level (more continents), but always leaves ocean.
  const landAmount = Math.min(1, Math.max(0, (p.level - 1) / 12));
  const blobs = useMemo(() => continents(p.radius, seed, landAmount), [p.radius, seed, landAmount]);
  const trees = useMemo(() => treePositions(p.totalTrees, p.radius, seed, landAmount), [p.totalTrees, p.radius, seed, landAmount]);
  const hue = 28 + 92 * p.vitality;
  const land = `hsl(${hue}, ${24 + p.vitality * 46}%, ${28 + p.vitality * 12}%)`;

  // A normal ringed world gets a single Saturn-style ring. Diamond unlocks the
  // crossing "atom" rings, but you still EARN them by leveling: one more ring
  // per tier, reaching the full atom only at the Singularity summit (Lv14).
  // Each ring is drawn in two halves - the far arc behind the globe, the near
  // arc in front - so it wraps the planet.
  const ATOM_RINGS = [
    { off: 30, w: 6, color: "#67e8f9", op: 0.7, tilt: -20 },
    { off: 40, w: 5.2, color: "#a78bfa", op: 0.6, tilt: 30 },
    { off: 38, w: 5, color: "#5eead4", op: 0.55, tilt: 78 },
    { off: 50, w: 4.4, color: "#f0abfc", op: 0.5, tilt: 124 },
  ];
  const atomCount = p.level >= 14 ? 4 : p.level >= 11 ? 3 : p.level >= 8 ? 2 : p.level >= 5 ? 1 : 0;
  const ringDefs = p.diamond
    ? ATOM_RINGS.slice(0, atomCount)
    : p.level >= 6
    ? [{ off: 34, w: 4.5, color: ACCENT, op: 0.6, tilt: -18 }]
    : [];
  const RING_RY = 0.3;
  const ringArc = (rx: number, near: boolean) =>
    `M ${-rx} 0 A ${rx} ${rx * RING_RY} 0 0 ${near ? 0 : 1} ${rx} 0`;

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
        <filter id={id("ringBlur")} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.7" /></filter>
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
            {/* Aurora curtain: green at the base fading up, like real auroras. */}
            <linearGradient id={id("curtain")} gradientUnits="userSpaceOnUse"
              x1="0" y1={108 - p.radius * 0.72} x2="0" y2={108 - p.radius * 1.7}>
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
              <stop offset="34%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="66%" stopColor="#7df2c8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={id("auroraLine")} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
              <stop offset="26%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="58%" stopColor="#d1fae5" stopOpacity="1" />
              <stop offset="82%" stopColor="#5eead4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={id("auroraHot")} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
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

      {/* Rings - far half (behind the planet) */}
      {ringDefs.length > 0 && (
        <g filter={`url(#${id("ringBlur")})`}>
          {ringDefs.map((r, i) => {
            const rx = p.radius + r.off;
            return (
              <g key={`rb${i}`} transform={`translate(120 108) rotate(${r.tilt})`}>
                <path d={ringArc(rx, false)} fill="none"
                  stroke={r.color} strokeOpacity={r.op} strokeWidth={r.w} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}

      <circle cx={120} cy={108} r={p.radius} fill={`url(#${id("globe")})`} />

      {/* Rotating surface: a strip of continents scrolls under the clipped
          globe so land and ocean pass across the limb. Two tiled copies make
          the wrap seamless. */}
      <g clipPath={`url(#${id("clip")})`}>
        <motion.g
          animate={{ x: [0, -p.radius * 2] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {[0, p.radius * 2].map((off) => (
            <g key={off} transform={`translate(${120 - p.radius + off} 108)`}>
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
          ))}
        </motion.g>
      </g>

      <circle cx={120} cy={108} r={p.radius} fill={`url(#${id("shade")})`} />

      {/* Rings - near half (in front of the planet) */}
      {ringDefs.length > 0 && (
        <g filter={`url(#${id("ringBlur")})`}>
          {ringDefs.map((r, i) => {
            const rx = p.radius + r.off;
            return (
              <g key={`rf${i}`} transform={`translate(120 108) rotate(${r.tilt})`}>
                <path d={ringArc(rx, true)} fill="none"
                  stroke={r.color} strokeOpacity={r.op} strokeWidth={r.w} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}

      {/* Diamond aurora - a flowing green curtain sweeping over the upper limb,
          with rays rising to a bright hotspot. Earned alongside the rings. */}
      {p.diamond && p.level >= 5 && (() => {
        const cx = 120, cy = 108, R = p.radius;
        const A0 = 206, A1 = 334;                 // sweep across the top
        const baseR = R * 0.92;                   // curtain foot, just inside the limb
        const PEAK = 0.6;                         // hotspot position along the sweep
        const N = 46;
        const ang = (f: number) => ((A0 + (A1 - A0) * f) * Math.PI) / 180;
        const foot = (f: number, rr = baseR) => {
          const a = ang(f);
          return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
        };
        const env = (f: number) =>
          0.4 * Math.sin(f * Math.PI) + 0.75 * Math.exp(-Math.pow((f - PEAK) / 0.17, 2));
        // bright base band path along the arc
        const [bl, blY] = foot(0), [br, brY] = foot(1);
        const band = `M ${bl} ${blY} A ${baseR} ${baseR} 0 0 1 ${br} ${brY}`;
        const [hx, hy] = foot(PEAK, baseR + R * 0.18);
        return (
          <g style={{ mixBlendMode: "screen" }}>
            {/* hotspot bloom */}
            <motion.ellipse
              cx={hx} cy={hy} rx={R * 0.62} ry={R * 0.5}
              fill={`url(#${id("auroraHot")})`} filter={`url(#${id("auroraBlur")})`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.75, 0.5, 0.68, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* curtain rays rising from the limb */}
            <g filter={`url(#${id("auroraBlur")})`}>
              {Array.from({ length: N }).map((_, i) => {
                const f = i / (N - 1);
                const a = ang(f);
                const [bx, by] = foot(f);
                const h = (10 + 34 * env(f)) * (0.85 + 0.3 * ((i * 37) % 7) / 7);
                const tx = cx + Math.cos(a) * (baseR + h);
                const ty = cy + Math.sin(a) * (baseR + h);
                const cax = cx + Math.cos(a + 0.05) * (baseR + h * 0.55);
                const cay = cy + Math.sin(a + 0.05) * (baseR + h * 0.55);
                return (
                  <motion.path
                    key={`ray${i}`}
                    d={`M ${bx} ${by} Q ${cax} ${cay} ${tx} ${ty}`}
                    fill="none" stroke={`url(#${id("curtain")})`} strokeWidth={2.6} strokeLinecap="round"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.25, 0.85, 0.5, 0.75, 0.25] }}
                    transition={{ duration: 3 + ((i * 13) % 5) * 0.5, repeat: Infinity, ease: "easeInOut", delay: (i % 9) * 0.18 }}
                  />
                );
              })}
            </g>

            {/* bright defined base band */}
            <motion.path
              d={band} fill="none" stroke={`url(#${id("auroraLine")})`} strokeWidth={3.2}
              strokeLinecap="round" filter={`url(#${id("auroraSoft")})`}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.75, 0.95, 0.6] }}
              transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
            />
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
  const [showStatuses, setShowStatuses] = useState(false);
  const vitalityPct = Math.round(p.vitality * 100);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">{t("prof.planetTitle")}</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowStatuses(true)}
            title={t("prof.statusAll")}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-transform hover:scale-105 active:scale-95"
            style={{ color: statusColor, borderColor: `${statusColor}55`, background: `${statusColor}18` }}
          >
            {t(`prof.status.${p.status}` as DictKey)}
          </button>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
            {t("prof.lvl")}{p.level}
          </span>
        </div>
      </div>

      {/* All possible planet statuses */}
      <AnimatePresence>
        {showStatuses && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setShowStatuses(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl z-10 max-h-[85dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold">{t("prof.statusTitle")}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {t("prof.statusNow")} <span className="font-medium" style={{ color: statusColor }}>{t(`prof.status.${p.status}` as DictKey)}</span> · {vitalityPct}%
                  </p>
                </div>
                <button onClick={() => setShowStatuses(false)} className="text-muted hover:text-white transition-colors"><X size={16} /></button>
              </div>
              <div className="overflow-y-auto px-3 py-2">
                {STATUS_LADDER.map((s, i) => {
                  const color = STATUS_COLOR[s.key];
                  const current = s.key === p.status;
                  const max = i === 0 ? 100 : STATUS_LADDER[i - 1].min;
                  return (
                    <div
                      key={s.key}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-lg"
                      style={current ? { background: `${color}18`, border: `1px solid ${color}55` } : undefined}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: current ? `0 0 8px ${color}` : undefined }} />
                      <span className="flex-1 text-sm font-medium" style={{ color: current ? color : "#fff" }}>
                        {t(`prof.status.${s.key}` as DictKey)}
                      </span>
                      <span className="text-[11px] font-mono text-muted">{s.min}{max < 100 ? `–${max}` : "+"}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted px-5 py-3 border-t border-border leading-relaxed">{t("prof.statusFoot")}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
