"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/context";
import { type Locale } from "@/lib/i18n/config";

// Applies the language saved on the user's account (DB) when it differs from
// the current device cookie - so a signed-in user's choice follows them across
// devices. Runs once.
export function LangSync({ dbLang }: { dbLang: Locale }) {
  const { lang, setLang } = useLang();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (dbLang && dbLang !== lang) setLang(dbLang);
  }, [dbLang, lang, setLang]);
  return null;
}
