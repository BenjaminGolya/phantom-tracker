"use client";

import { signOut } from "next-auth/react";
import { LogOut, Settings, Info, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GhostLogo, GhostAvatar } from "@/components/brand/ghost-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking/tapping outside of it
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [open]);

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-surface shrink-0">
      <div className="lg:hidden flex items-center gap-2">
        <GhostLogo size={28} className="phantom-glow" />
        <span className="font-semibold text-sm">Phantom Tracker</span>
      </div>

      {/* Back to the public landing page */}
      <Link
        href="/"
        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:text-white hover:bg-surface-2 transition-colors"
      >
        <Home size={15} />
        Home
      </Link>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-full hover:bg-surface-2 transition-colors"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt="avatar"
              className="w-7 h-7 rounded-full object-cover border border-primary/30"
            />
          ) : (
            <GhostAvatar size={28} className="border border-primary/30" />
          )}
          <span className="text-sm text-muted hidden sm:block">{user?.name ?? user?.email}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-52 bg-surface-2 border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border flex items-center gap-2.5">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-primary/30 shrink-0" />
              ) : (
                <GhostAvatar size={36} className="border border-primary/30 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Home size={14} />
              Back to home
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Settings size={14} />
              Settings
            </Link>
            <Link
              href="/welcome"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Info size={14} />
              About &amp; install
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
