"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { computeTraits, TRAIT_ORDER, type TraitHabit } from "@/lib/profile-traits";

const ACCENT = "#7f49c3";

export function PersonalityConstellation({ habits, pro }: { habits: TraitHabit[]; pro: boolean }) {
  const { t } = useLang();
  const traits = computeTraits(habits, { isPro: pro });
  const descKey = traits.typeKey.replace("type.", "typeDesc.") as DictKey;

  const cx = 110, cy = 110, R = 84;
  const n = TRAIT_ORDER.length;
  const pt = (i: number, r: number) => {
    const a = (-90 + i * (360 / n)) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const ring = (f: number) => TRAIT_ORDER.map((_, i) => pt(i, R * f).join(",")).join(" ");
  const shape = TRAIT_ORDER.map((k, i) => pt(i, R * Math.max(0.06, traits.scores[k])).join(",")).join(" ");

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="text-sm font-medium mb-4">{t("prof.constellationTitle")}</h2>
      <div className="grid sm:grid-cols-2 gap-5 items-center">
        {/* Radar / constellation */}
        <div className="flex items-center justify-center">
          <svg viewBox="-55 -8 330 246" className="w-full max-w-[300px]">
            {[0.33, 0.66, 1].map((f) => (
              <polygon key={f} points={ring(f)} fill="none" stroke="#ffffff10" strokeWidth={1} />
            ))}
            {TRAIT_ORDER.map((_, i) => {
              const [x, y] = pt(i, R);
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ffffff10" strokeWidth={1} />;
            })}
            <motion.polygon
              points={shape}
              fill={`${ACCENT}40`}
              stroke={ACCENT}
              strokeWidth={2}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            {TRAIT_ORDER.map((k, i) => {
              const [x, y] = pt(i, R * Math.max(0.06, traits.scores[k]));
              return (
                <motion.circle
                  key={k} cx={x} cy={y} r={4} fill="#fff"
                  style={{ filter: `drop-shadow(0 0 5px ${ACCENT})` }}
                  initial={{ opacity: 0 }} animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                />
              );
            })}
            {/* axis labels */}
            {TRAIT_ORDER.map((k, i) => {
              const [x, y] = pt(i, R + 16);
              const anchor = x < cx - 4 ? "end" : x > cx + 4 ? "start" : "middle";
              return (
                <text key={k} x={x} y={y} fontSize={9} fill="#9ca3af" textAnchor={anchor} dominantBaseline="middle">
                  {t(`trait.${k}` as DictKey)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Stats on the right */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">{t("prof.typeTitle")}</p>
          <h3 className="text-xl font-bold mt-0.5" style={{ color: ACCENT }}>{t(traits.typeKey as DictKey)}</h3>
          <p className="text-xs text-muted leading-relaxed mt-1 mb-4">{t(descKey)}</p>

          <div className="space-y-2.5">
            {TRAIT_ORDER.map((k) => {
              const v = Math.round(traits.scores[k] * 100);
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="text-muted">{t(`trait.${k}` as DictKey)}</span>
                    <span className="font-mono text-white/80">{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: ACCENT }}
                      initial={{ width: 0 }}
                      animate={{ width: `${v}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
