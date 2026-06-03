"use client";

import { signOut } from "next-auth/react";
import { LogOut, Ghost } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-surface shrink-0">
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center phantom-glow">
          <Ghost size={15} className="text-white" />
        </div>
        <span className="font-semibold text-sm">Phantom Tracker</span>
      </div>

      <div className="hidden lg:block" />

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
            {(user?.name ?? user?.email ?? "U")?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-sm text-muted hidden sm:block">{user?.name ?? user?.email}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-10 w-48 bg-surface-2 border border-border rounded-xl shadow-xl z-50 py-1">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-medium text-white">{user?.name}</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
