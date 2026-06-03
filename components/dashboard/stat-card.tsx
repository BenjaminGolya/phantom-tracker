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
        "bg-surface border rounded-xl p-4 transition-all",
        highlight ? "border-primary/40 phantom-glow" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted">{label}</span>
        {icon}
      </div>
      <div className={cn("text-2xl font-mono font-bold", highlight && "text-primary")}>
        {value}
      </div>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </motion.div>
  );
}
