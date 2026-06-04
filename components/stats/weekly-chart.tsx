"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface WeeklyChartProps {
  data: { date: string; label: string; count: number; total: number }[];
  total: number;
}

export default function WeeklyChart({ data, total }: WeeklyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, Math.max(total, 1)]} />
        <Tooltip
          cursor={{ fill: "#1a1a1a" }}
          contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`${v}/${total}`, "Completed"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.count === entry.total && entry.total > 0 ? "#7f49c3" : "#2a2a2a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
