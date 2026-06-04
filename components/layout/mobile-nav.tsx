"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1.5 p-2 rounded-full bg-surface/95 backdrop-blur-xl border border-border shadow-2xl shadow-black/50">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
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
