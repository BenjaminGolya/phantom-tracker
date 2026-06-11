"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Clock, Flame, Gem, Check, Inbox } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { dfLocale } from "@/lib/i18n/date";

type Notif = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  read: boolean;
  createdAt: string;
};

function iconFor(kind: string | null) {
  switch (kind) {
    case "reminder": return Clock;
    case "streak": return Flame;
    case "billing": return Gem;
    default: return Bell;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* offline - ignore */ }
  }, []);

  // Initial load + light polling.
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Opening clears the unread badge (marks all seen), but the items keep their
  // "new" highlight for this viewing - like Facebook.
  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
    }
  }

  function openItem(n: Notif) {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    if (!n.read) fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
    setOpen(false);
    if (n.url) router.push(n.url);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={t("notif.title")}
        className="relative p-2 rounded-full text-muted hover:text-white hover:bg-surface-2 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold leading-[15px] text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[330px] max-w-[calc(100vw-1.5rem)] bg-surface-2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
            <span className="text-sm font-semibold">{t("notif.title")}</span>
            {items.some((i) => !i.read) && (
              <button
                onClick={() => { setItems((p) => p.map((i) => ({ ...i, read: true }))); setUnread(0); fetch("/api/notifications/read", { method: "POST" }).catch(() => {}); }}
                className="flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors"
              >
                <Check size={12} /> {t("notif.markAll")}
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                <Inbox size={22} className="text-muted/60" />
                <p className="text-sm text-muted">{t("notif.empty")}</p>
                <p className="text-[11px] text-muted/70">{t("notif.emptySub")}</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = iconFor(n.icon);
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`w-full flex gap-3 px-3.5 py-3 text-left border-b border-border/60 last:border-0 transition-colors hover:bg-surface ${n.read ? "" : "bg-primary/5"}`}
                  >
                    <span className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border shrink-0 text-primary">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white truncate">{n.title}</span>
                      <span className="block text-xs text-muted leading-snug line-clamp-2">{n.body}</span>
                      <span className="block text-[10px] text-muted/70 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dfLocale(lang) })}
                      </span>
                    </span>
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
