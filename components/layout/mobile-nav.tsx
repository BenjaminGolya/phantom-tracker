"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/90 backdrop-blur-md">
      <div className="flex items-center justify-around h-16 px-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all",
                active ? "text-primary" : "text-muted hover:text-white"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                  active
                    ? "bg-primary/15 shadow-[0_0_12px_#7f49c330]"
                    : ""
                )}
              >
                <Icon size={18} />
              </span>
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
