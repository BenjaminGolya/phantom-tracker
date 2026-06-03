"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during SSR and the first client render, then true after mount.
 *
 * Use this to gate any rendering that depends on `new Date()`, `localStorage`,
 * `window`, or other browser-only values — so the server-rendered HTML and the
 * first client render stay identical and React doesn't throw a hydration
 * mismatch (#418 / #423 / #425).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
