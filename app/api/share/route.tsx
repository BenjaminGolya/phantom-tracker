import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Personal, shareable progress card (1200×630). Values are passed as query
// params by the client (it knows its own stats), so no auth/DB is needed and it
// can run on the edge. e.g. /api/share?streak=12&completions=340&rate=86&level=Sprout
export const runtime = "edge";

const ACCENT = "#7f49c3";
const LOGO = "https://phantomtracker.io/ghost-logo-128.png";

const clampInt = (v: string | null, max: number) =>
  Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const streak = clampInt(sp.get("streak"), 100000);
  const completions = clampInt(sp.get("completions"), 1000000);
  const rate = clampInt(sp.get("rate"), 100);
  const level = (sp.get("level") || "").slice(0, 24);

  const stat = (value: string | number, label: string, color: string) => ({
    value: String(value),
    label,
    color,
  });
  const stats = [
    stat(`${streak}🔥`, "day streak", "#f97316"),
    stat(completions, "check-ins", ACCENT),
    stat(`${rate}%`, "consistency", "#22c55e"),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "radial-gradient(120% 120% at 18% 0%, #2a1a45 0%, #0a0a0f 55%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: -160, right: -120, width: 520, height: 520, borderRadius: 9999, background: "rgba(127,73,195,0.35)", filter: "blur(40px)", display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} width={60} height={60} alt="" style={{ borderRadius: 16 }} />
          <div style={{ fontSize: 28, fontWeight: 700, display: "flex" }}>Phantom Tracker</div>
        </div>

        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.5, display: "flex" }}>
          My habit progress
        </div>
        {level ? (
          <div style={{ fontSize: 30, color: "#c4b5e8", marginTop: 10, display: "flex" }}>
            Rank: {level}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 18, marginTop: 44 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(127,73,195,0.4)",
                borderRadius: 20,
                padding: "22px 34px",
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 800, color: s.color, display: "flex" }}>{s.value}</div>
              <div style={{ fontSize: 22, color: "#a8a8b8", marginTop: 4, display: "flex" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 24, color: "#9a9aac", marginTop: 40, display: "flex" }}>
          Build habits that actually stick · phantomtracker.io
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
