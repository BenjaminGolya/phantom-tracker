"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale, DEFAULT_LOCALE, LANG_COOKIE } from "./config";
import { translate, type DictKey } from "./dictionaries";

type Ctx = {
  lang: Locale;
  t: (key: DictKey) => string;
  setLang: (l: Locale) => void;
};

const LangContext = createContext<Ctx>({
  lang: DEFAULT_LOCALE,
  t: (k) => translate(DEFAULT_LOCALE, k),
  setLang: () => {},
});

export function LanguageProvider({
  initialLang = DEFAULT_LOCALE,
  children,
}: {
  initialLang?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Locale>(initialLang);

  const setLang = useCallback(
    (l: Locale) => {
      setLangState(l);
      // Persist in a cookie so SSR + future visits use it.
      document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      // Save to the account when signed in (ignored if logged out).
      fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: l }),
      }).catch(() => {});
      // Re-render server components that read the cookie.
      router.refresh();
    },
    [router]
  );

  const t = useCallback((key: DictKey) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Convenience: just the translator. */
export function useT() {
  return useContext(LangContext).t;
}
