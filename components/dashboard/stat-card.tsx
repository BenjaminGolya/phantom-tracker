"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, icon, sub, highlight }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-surface border rounded-xl px-3 py-2.5 transition-all",
        highlight ? "border-primary/40 phantom-glow" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted">{label}</span>
        {icon}
      </div>
      <div className={cn("text-lg font-mono font-bold leading-tight", highlight && "text-primary")}>
        {value}
      </div>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </motion.div>
  );
}
