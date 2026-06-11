import { ImageResponse } from "next/og";

// Dynamically generated 1200×630 social/Google share image for the whole site.
// Edge runtime: @vercel/og loads fonts via fetch (avoids a Windows path bug),
// and fetches the logo from its public URL.
export const runtime = "edge";
export const alt = "Phantom Tracker - habit tracker with streaks, levels and a living world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og fetches the logo from the public asset URL.
const logoSrc = "https://phantomtracker.io/ghost-logo-128.png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(120% 120% at 20% 0%, #2a1a45 0%, #0a0a0f 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* glow blob */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(127,73,195,0.35)",
            filter: "blur(40px)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={72} height={72} alt="" style={{ borderRadius: 18 }} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
            Phantom Tracker
          </div>
        </div>

        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, display: "flex", flexWrap: "wrap", maxWidth: 900 }}>
          Build habits that
          <span style={{ color: "#a974e0", marginLeft: 18 }}>actually stick</span>.
        </div>

        <div style={{ fontSize: 32, color: "#b8b8c4", marginTop: 28, maxWidth: 820, display: "flex" }}>
          Daily streaks, XP & levels, and a living world that grows with you. Free, on every device.
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {["Streaks", "Levels & XP", "Living world", "Reminders"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                fontSize: 24,
                color: "#d8c7ef",
                border: "1px solid rgba(127,73,195,0.5)",
                background: "rgba(127,73,195,0.15)",
                borderRadius: 9999,
                padding: "8px 20px",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
