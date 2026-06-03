"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart2, Settings, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user?: { name?: string | null; email?: string | null };
  profileLevel?: { level: number; label: string; emoji: string; color: string; progress: number; xp: number };
}

export function Sidebar({ user, profileLevel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-surface shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center phantom-glow shrink-0">
          <Ghost size={15} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>

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
                  {profileLevel.label}
                </p>
                <p className="text-[10px] text-muted">Level {profileLevel.level}</p>
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
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
            {(user?.name ?? user?.email ?? "U")?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
