"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionaries";

const nav: { href: string; key: DictKey; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", key: "common.dashboard", icon: LayoutDashboard },
  { href: "/habits", key: "nav.habits", icon: Target },
  { href: "/stats", key: "nav.stats", icon: BarChart2 },
  { href: "/settings", key: "common.settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1.5 p-2 rounded-full bg-surface/95 backdrop-blur-xl border border-border shadow-2xl shadow-black/50">
        {nav.map(({ href, key, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={t(key)}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-95",
                active
                  ? "bg-primary text-white shadow-[0_0_16px_#7f49c355]"
                  : "text-muted hover:text-white hover:bg-surface-2"
              )}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
