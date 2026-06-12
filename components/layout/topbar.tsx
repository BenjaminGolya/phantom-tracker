"use client";

import { signOut } from "next-auth/react";
import { LogOut, Settings, Info, Home, Gem } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GhostLogo, GhostAvatar } from "@/components/brand/ghost-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useT } from "@/lib/i18n/context";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
  pro?: boolean;
  lifetime?: boolean;
}

export function TopBar({ user, pro, lifetime }: TopBarProps) {
  const t = useT();
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
      <div className="lg:hidden flex items-center gap-2 min-w-0 mr-2">
        <GhostLogo size={26} className="phantom-glow shrink-0" />
        <span className="font-semibold text-sm truncate min-w-0 hidden min-[400px]:inline">Phantom Tracker</span>
        {pro && (
          lifetime ? (
            <span
              title="Diamond"
              className="shrink-0 inline-flex items-center gap-0.5 text-[8px] font-bold tracking-wider px-1 py-0.5 rounded-md border"
              style={{ background: "linear-gradient(135deg,#a5f3fc26,#38bdf826,#818cf826)", borderColor: "#67e8f966", color: "#67e8f9" }}
            >
              <Gem size={8} /> DIAMOND
            </span>
          ) : (
            <span className="shrink-0 text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/40">
              PRO
            </span>
          )
        )}
      </div>

      {/* Back to the public landing page */}
      <Link
        href="/"
        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:text-white hover:bg-surface-2 transition-colors"
      >
        <Home size={15} />
        {t("common.home")}
      </Link>

      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell />
        <LanguageSwitcher />
        <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-full hover:bg-surface-2 transition-colors shrink-0"
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt="avatar"
              width={28}
              height={28}
              style={{ width: 28, height: 28 }}
              className="rounded-full object-cover border border-primary/30 shrink-0"
            />
          ) : (
            <GhostAvatar size={28} className="border border-primary/30" />
          )}
          <span className="text-sm text-muted hidden sm:block truncate max-w-[160px]">{user?.name ?? user?.email}</span>
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
                <p className="text-xs font-medium text-white truncate">{user?.name ?? t("common.user")}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Home size={14} />
              {t("common.backToHome")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Settings size={14} />
              {t("common.settings")}
            </Link>
            <Link
              href="/welcome"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <Info size={14} />
              {t("common.aboutInstall")}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              {t("common.signOut")}
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
