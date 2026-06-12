// On-brand decorative SVG hero illustrations for blog posts. Inline SVG so
// there are no external image assets, they stay crisp at any size, and match
// the dark/purple theme.

const ACCENT = "#7f49c3";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 800 340" className="w-full h-auto block" role="img">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c1330" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>
        <radialGradient id="glow" cx="22%" cy="12%" r="70%">
          <stop offset="0%" stopColor="rgba(127,73,195,0.45)" />
          <stop offset="100%" stopColor="rgba(127,73,195,0)" />
        </radialGradient>
      </defs>
      <rect width="800" height="340" fill="url(#bgGrad)" />
      <rect width="800" height="340" fill="url(#glow)" />
      {children}
    </svg>
  );
}

// Diamond announcement - an icy gem with aurora arcs and sparkles.
export function DiamondHero() {
  const CYAN = "#67e8f9";
  return (
    <Frame>
      <defs>
        <linearGradient id="dhGem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="55%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="dhAurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(103,232,249,0)" />
          <stop offset="35%" stopColor="#67e8f9" />
          <stop offset="60%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="rgba(94,234,212,0)" />
        </linearGradient>
      </defs>
      {/* aurora bands */}
      <path d="M 120 120 Q 400 30 690 110" fill="none" stroke="url(#dhAurora)" strokeWidth={7} strokeLinecap="round" opacity={0.55} />
      <path d="M 90 160 Q 400 70 710 150" fill="none" stroke="url(#dhAurora)" strokeWidth={4} strokeLinecap="round" opacity={0.35} />
      {/* gem */}
      <g transform="translate(400 195)">
        <polygon points="-78,-28 -40,-66 40,-66 78,-28 0,68" fill="url(#dhGem)" opacity={0.95} />
        <polygon points="-78,-28 -40,-66 -14,-28" fill="#cffafe" opacity={0.5} />
        <polygon points="14,-28 40,-66 78,-28" fill="#0ea5e9" opacity={0.45} />
        <polygon points="-14,-28 0,68 14,-28" fill="#e0f2fe" opacity={0.35} />
        <polyline points="-78,-28 78,-28" stroke="#e0f2fe" strokeWidth={2} opacity={0.6} />
      </g>
      {/* sparkles */}
      {[[180, 230, 5], [250, 90, 4], [560, 250, 6], [640, 80, 4], [310, 280, 3]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`} opacity={0.8}>
          <path d={`M0 ${-r} L${(r as number) * 0.3} ${-(r as number) * 0.3} L${r} 0 L${(r as number) * 0.3} ${(r as number) * 0.3} L0 ${r} L${-(r as number) * 0.3} ${(r as number) * 0.3} L${-r} 0 L${-(r as number) * 0.3} ${-(r as number) * 0.3} Z`} fill={CYAN} />
        </g>
      ))}
    </Frame>
  );
}

// Build a habit - a contribution grid filling up into a check.
export function HabitGridHero() {
  const cols = 16, rows = 7, cell = 26, gap = 8;
  const ox = 80, oy = 70;
  return (
    <Frame>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const seed = (c * 7 + r * 3) % 11;
          const lit = (c / cols) > 0.15 && seed < 6;
          const op = lit ? 0.25 + ((seed % 4) / 4) * 0.7 : 0.08;
          return (
            <rect
              key={`${r}-${c}`}
              x={ox + c * (cell + gap)}
              y={oy + r * (cell + gap)}
              width={cell}
              height={cell}
              rx={6}
              fill={lit ? ACCENT : "#ffffff"}
              opacity={lit ? op : 0.06}
            />
          );
        })
      )}
      <circle cx={650} cy={170} r={54} fill={ACCENT} opacity={0.95} />
      <path d="M624 170 l18 18 l34 -38" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// Best free tracker - a stylized app card with checked rows.
export function TrackerCardHero() {
  const rows = [0, 1, 2, 3];
  return (
    <Frame>
      <rect x={250} y={56} width={300} height={228} rx={22} fill="#15151c" stroke="#2a2440" strokeWidth={2} />
      <rect x={274} y={84} width={120} height={14} rx={7} fill="#ffffff" opacity={0.85} />
      <rect x={274} y={106} width={80} height={10} rx={5} fill={ACCENT} opacity={0.8} />
      {rows.map((i) => {
        const y = 140 + i * 34;
        const done = i < 2;
        return (
          <g key={i}>
            <rect x={274} y={y} width={252} height={26} rx={8} fill="#1f1b2e" />
            <circle cx={290} cy={y + 13} r={9} fill={done ? ACCENT : "none"} stroke={done ? ACCENT : "#4a4460"} strokeWidth={2} />
            {done && <path d={`M285 ${y + 13} l4 4 l7 -8`} stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x={310} y={y + 8} width={120 - i * 14} height={9} rx={4.5} fill="#ffffff" opacity={done ? 0.5 : 0.25} />
          </g>
        );
      })}
      {/* little ghost mark */}
      <g transform="translate(120 150)">
        <circle r={46} fill={ACCENT} opacity={0.18} />
        <path d="M-22 18 v-20 a22 22 0 0 1 44 0 v20 l-7 -7 l-8 7 l-7 -7 l-8 7 l-7 -7 Z" fill="#e8e3f5" />
        <circle cx={-8} cy={-4} r={4} fill="#1c1330" />
        <circle cx={8} cy={-4} r={4} fill="#1c1330" />
      </g>
    </Frame>
  );
}

// Why streaks work - a flame over rising bars.
export function StreakHero() {
  const bars = [60, 95, 130, 175, 215];
  return (
    <Frame>
      {bars.map((h, i) => (
        <rect key={i} x={120 + i * 70} y={300 - h} width={46} height={h} rx={10}
          fill={ACCENT} opacity={0.3 + i * 0.14} />
      ))}
      {/* flame */}
      <g transform="translate(560 150)">
        <circle r={86} fill={ACCENT} opacity={0.16} />
        <path d="M0 -70 C 40 -28, 44 6, 20 30 C 36 18, 36 -6, 10 -18 C 22 8, 6 18, 2 40 C -34 28, -40 -10, 0 -70 Z" fill="#f97316" />
        <path d="M0 -34 C 20 -12, 20 8, 6 24 C 12 12, 6 -2, -4 -8 C 2 8, -8 16, -6 30 C -24 18, -22 -8, 0 -34 Z" fill="#fbbf24" />
      </g>
    </Frame>
  );
}
