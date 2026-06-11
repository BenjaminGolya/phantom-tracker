"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface WeeklyChartProps {
  data: { date: string; label: string; count: number; total: number }[];
  total: number;
}

export default function WeeklyChart({ data, total }: WeeklyChartProps) {
  // Recharts paints via SVG attributes (no var() support), so resolve the
  // active accent (purple, or cyan on the Diamond theme) at runtime.
  const [accent, setAccent] = useState("127 73 195");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    if (v) setAccent(v);
  }, []);
  const accentRgb = `rgb(${accent})`;
  const accentSoft = `rgb(${accent} / 0.10)`;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={26} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} dy={4} />
        <YAxis hide domain={[0, Math.max(total, 1)]} />
        <Tooltip
          cursor={{ fill: accentSoft }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const count = Number(payload[0].value);
            const done = count >= total && total > 0;
            return (
              <div
                style={{
                  background: "#1c1c1e",
                  border: "1px solid #34343a",
                  borderRadius: 10,
                  padding: "8px 12px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: done ? accentRgb : "#3f3f46",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: done ? accentRgb : "#fff" }}>
                    {count}/{total}
                  </span>
                  <span>completed{done ? " · perfect day 🎉" : ""}</span>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.count === entry.total && entry.total > 0 ? accentRgb : "#33333a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
