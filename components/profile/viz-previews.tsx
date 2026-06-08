"use client";

// Small, self-contained mini-previews of four possible "profile type"
// visualizations. These run on sample data and are meant only to help choose a
// direction — the chosen one will be built out fully (in real 3D) afterwards.

import { motion } from "framer-motion";

const ACCENT = "#7f49c3";

// ── 1. Personality constellation (3D-tilted radar) ───────────────────────────
function Constellation() {
  const axes = ["Consistency", "Discipline", "Variety", "Health", "Mind"];
  const vals = [0.85, 0.6, 0.95, 0.55, 0.75];
  const cx = 100, cy = 100, R = 78;
  const pt = (i: number, r: number) => {
    const a = (-90 + i * (360 / axes.length)) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const ring = (f: number) => axes.map((_, i) => pt(i, R * f).join(",")).join(" ");
  const shape = vals.map((v, i) => pt(i, R * v).join(",")).join(" ");

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: 600 }}>
      <motion.svg
        viewBox="0 0 200 200"
        className="w-40 h-40"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        initial={{ rotateX: 52 }}
      >
        {[0.33, 0.66, 1].map((f) => (
          <polygon key={f} points={ring(f)} fill="none" stroke="#ffffff14" strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ffffff14" strokeWidth={1} />;
        })}
        <polygon points={shape} fill={`${ACCENT}55`} stroke={ACCENT} strokeWidth={2} />
        {vals.map((v, i) => {
          const [x, y] = pt(i, R * v);
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#fff" style={{ filter: `drop-shadow(0 0 4px ${ACCENT})` }} />;
        })}
      </motion.svg>
    </div>
  );
}

// ── 2. Growing world / terrain ────────────────────────────────────────────────
function GrowingWorld() {
  const trees = [
    { x: 88, y: 70, s: 1 }, { x: 110, y: 64, s: 1.2 }, { x: 128, y: 78, s: 0.9 },
    { x: 74, y: 90, s: 1.1 }, { x: 100, y: 86, s: 1 }, { x: 122, y: 96, s: 1.15 },
    { x: 92, y: 104, s: 0.85 },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.svg
        viewBox="0 0 200 200"
        className="w-40 h-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <radialGradient id="planet" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#3a7d52" />
            <stop offset="55%" stopColor="#2a5d8f" />
            <stop offset="100%" stopColor="#141026" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="110" rx="95" ry="30" fill="none" stroke={`${ACCENT}40`} strokeWidth={1.5} />
        <circle cx="100" cy="100" r="62" fill="url(#planet)" stroke="#ffffff10" />
        {trees.map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
            <rect x={-1.2} y={4} width={2.4} height={6} fill="#6b4a2a" />
            <path d="M0,-10 L6,5 L-6,5 Z" fill="#4fae6d" />
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

// ── 3. Category galaxy ────────────────────────────────────────────────────────
function Galaxy() {
  const orbits = [
    { rx: 70, ry: 26, dur: 18, nodes: [{ c: "#4fae6d", a: 0 }, { c: "#f0a04b", a: 180 }] },
    { rx: 52, ry: 19, dur: 12, nodes: [{ c: "#5b8def", a: 90 }] },
    { rx: 86, ry: 32, dur: 26, nodes: [{ c: "#e05b8f", a: 40 }, { c: "#a855f7", a: 220 }] },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: 600 }}>
      <svg viewBox="0 0 200 200" className="w-40 h-40" style={{ transform: "rotateX(62deg)" }}>
        {orbits.map((o, i) => (
          <g key={i}>
            <ellipse cx="100" cy="100" rx={o.rx} ry={o.ry} fill="none" stroke="#ffffff12" strokeWidth={1} />
            <motion.g
              style={{ originX: "100px", originY: "100px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "linear" }}
            >
              {o.nodes.map((n, j) => {
                const a = (n.a * Math.PI) / 180;
                return (
                  <circle key={j} cx={100 + Math.cos(a) * o.rx} cy={100 + Math.sin(a) * o.ry} r={5}
                    fill={n.c} style={{ filter: `drop-shadow(0 0 5px ${n.c})` }} />
                );
              })}
            </motion.g>
          </g>
        ))}
        <circle cx="100" cy="100" r="9" fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${ACCENT})` }} />
        <circle cx="100" cy="100" r="15" fill="none" stroke={`${ACCENT}66`} strokeWidth={2} />
      </svg>
    </div>
  );
}

// ── 4. Habit tower / city (isometric) ────────────────────────────────────────
function Tower() {
  const bars = [
    { x: 40, h: 50, c: "#4fae6d" }, { x: 70, h: 90, c: "#5b8def" },
    { x: 100, h: 70, c: ACCENT }, { x: 130, h: 110, c: "#f0a04b" },
    { x: 160, h: 40, c: "#e05b8f" },
  ];
  const w = 22, dx = 9, dy = -5; // iso depth offset
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 220 200" className="w-44 h-40">
        {bars.map((b, i) => {
          const baseY = 150;
          const topY = baseY - b.h;
          const x = b.x;
          return (
            <g key={i}>
              {/* front */}
              <rect x={x} y={topY} width={w} height={b.h} fill={b.c} opacity={0.95} />
              {/* side */}
              <polygon points={`${x + w},${topY} ${x + w + dx},${topY + dy} ${x + w + dx},${topY + dy + b.h} ${x + w},${baseY}`} fill={b.c} opacity={0.6} />
              {/* top */}
              <polygon points={`${x},${topY} ${x + dx},${topY + dy} ${x + w + dx},${topY + dy} ${x + w},${topY}`} fill={b.c} />
              <motion.rect
                x={x} y={topY} width={w} height={b.h} fill="url(#sheen)"
                initial={{ opacity: 0.0 }} animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              />
            </g>
          );
        })}
        <defs>
          <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#fff0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export const VIZ_OPTIONS = [
  { id: "constellation", n: 1, title: "Personality constellation", desc: "A rotating 3D radar fingerprint across traits like Consistency, Discipline, Variety, Health and Mind.", Comp: Constellation },
  { id: "world", n: 2, title: "Growing world", desc: "A little planet that gains terrain and trees as your habits and streaks grow.", Comp: GrowingWorld },
  { id: "galaxy", n: 3, title: "Category galaxy", desc: "Your habit categories orbit a core star, sized and lit by the XP you earn in each.", Comp: Galaxy },
  { id: "tower", n: 4, title: "Habit city", desc: "Each habit is a tower that rises with its level — your skyline shows your whole profile.", Comp: Tower },
] as const;
