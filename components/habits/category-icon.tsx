"use client";

import { useState, useEffect } from "react";
import { categoryIcon, categoryIconDefault } from "@/lib/i18n/category";

/**
 * The small glyph for a habit category. Renders the deterministic built-in
 * icon on the server/first paint, then upgrades to the full lookup (which can
 * read custom icons from localStorage) after mount - so there's no hydration
 * mismatch.
 */
export function CategoryIcon({ label, className }: { label: string | null | undefined; className?: string }) {
  const [icon, setIcon] = useState(() => categoryIconDefault(label));
  useEffect(() => { setIcon(categoryIcon(label)); }, [label]);
  if (!icon) return null;
  return <span aria-hidden className={className}>{icon}</span>;
}
