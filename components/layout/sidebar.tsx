"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart2, Settings, Sparkles, Shield, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { GhostLogo, GhostAvatar } from "@/components/brand/ghost-mark";

import { useLang } from "@/lib/i18n/context";
import { levelLabel } from "@/lib/i18n/levels";
import type { DictKey } from "@/lib/i18n/dictionaries";

const nav: { href: string; key: DictKey; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", key: "common.dashboard", icon: LayoutDashboard },
  { href: "/habits", key: "nav.habits", icon: Target },
  { href: "/stats", key: "nav.stats", icon: BarChart2 },
  { href: "/settings", key: "common.settings", icon: Settings },
];

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
  pro?: boolean;
  lifetime?: boolean;
  isAdmin?: boolean;
  profileLevel?: { level: number; label: string; emoji: string; color: string; progress: number; xp: number };
}

export function Sidebar({ user, pro, lifetime, isAdmin, profileLevel }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang } = useLang();

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-surface shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <GhostLogo size={28} className="phantom-glow" />
        <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
        {pro && (
          lifetime ? (
            <span
              className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md border"
              style={{ background: "linear-gradient(135deg,#a5f3fc26,#38bdf826,#818cf826)", borderColor: "#67e8f966", color: "#67e8f9" }}
            >
              <Gem size={9} /> DIAMOND
            </span>
          ) : (
            <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/40">
              PRO
            </span>
          )
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                active
                  ? "text-primary"
                  : "text-muted hover:text-white hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0",
                  active
                    ? "bg-primary/15 shadow-[0_0_10px_#7f49c330]"
                    : "group-hover:bg-surface-2"
                )}
              >
                <Icon size={15} />
              </span>
              {t(key)}
            </Link>
          );
        })}

        {/* Admin-only entry */}
        {isAdmin && (() => {
          const active = pathname.startsWith("/admin");
          return (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                active ? "text-primary" : "text-muted hover:text-white hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0",
                  active ? "bg-primary/15 shadow-[0_0_10px_#7f49c330]" : ""
                )}
              >
                <Shield size={15} />
              </span>
              Admin
            </Link>
          );
        })()}
      </nav>

      {/* Upgrade CTA (free users only) */}
      {!pro && (
        <Link
          href="/pricing"
          className="mx-3 mb-2 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-all flex items-center gap-2 group"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20 text-primary shrink-0">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">{t("nav.upgrade")}</p>
            <p className="text-[10px] text-muted">{t("nav.upgradeSub")}</p>
          </div>
        </Link>
      )}

      {/* Profile level card */}
      {profileLevel && (
        <Link
          href="/stats"
          className="mx-3 mb-2 px-3 py-2.5 rounded-xl border transition-all hover:border-primary/40 group"
          style={{ borderColor: `${profileLevel.color}25`, background: `${profileLevel.color}08` }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg leading-none font-light" style={{ color: profileLevel.color }}>{profileLevel.emoji}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: profileLevel.color }}>
                  {levelLabel(profileLevel.label, lang)}
                </p>
                <p className="text-[10px] text-muted">{t("nav.level")} {profileLevel.level}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted">{profileLevel.xp} XP</span>
          </div>
          {/* XP bar */}
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${profileLevel.progress}%`, backgroundColor: profileLevel.color }}
            />
          </div>
        </Link>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-primary/30 shrink-0" />
          ) : (
            <GhostAvatar size={28} className="border border-primary/30 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
