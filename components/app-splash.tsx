"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";

// Full-screen branded splash shown while the app first loads. It's mounted in
// the root layout, so it appears on a real page load ("opening the app") and
// not on in-app client navigations (the root layout doesn't remount).
export function AppSplash() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const MIN_MS = 650; // keep it on screen long enough to not flash
    const start = performance.now();
    let hideTimer: ReturnType<typeof setTimeout>;
    let unmountTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      hideTimer = setTimeout(() => {
        setFading(true);
        unmountTimer = setTimeout(() => setGone(true), 450);
      }, wait);
    };

    let safety: ReturnType<typeof setTimeout>;
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      safety = setTimeout(finish, 3000); // never hang if 'load' is missed
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
      clearTimeout(safety);
      window.removeEventListener("load", finish);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-[450ms] ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute w-64 h-64 rounded-full bg-primary/15 blur-3xl" />
      <GhostLogo size={64} className="phantom-glow animate-pulse" />
      <p className="relative mt-4 text-sm font-semibold tracking-tight text-white">Phantom Tracker</p>
      <Loader2 size={18} className="relative mt-3 text-primary animate-spin" />
    </div>
  );
}
