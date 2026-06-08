"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS } from "@/lib/i18n/config";

export function LanguageSwitcher({ className = "", openUp = false }: { className?: string; openUp?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:text-white hover:bg-surface-2 transition-colors"
        aria-label="Change language"
      >
        <Globe size={15} />
        <span className="uppercase text-xs font-medium">{lang}</span>
      </button>

      {open && (
        <div className={`absolute right-0 w-40 bg-surface-2 border border-border rounded-xl shadow-xl z-[60] py-1 overflow-hidden ${openUp ? "bottom-10" : "top-10"}`}>
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>{LOCALE_FLAGS[l]}</span>
                <span className={l === lang ? "text-white" : ""}>{LOCALE_NAMES[l]}</span>
              </span>
              {l === lang && <Check size={13} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
