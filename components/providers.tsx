"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/i18n/context";
import { type Locale } from "@/lib/i18n/config";

export function Providers({ children, lang }: { children: React.ReactNode; lang?: Locale }) {
  return (
    <SessionProvider
      // Don't refetch the session on every window focus / interval — it caused
      // a slow /api/auth/session call on each tab switch. The JWT is valid for
      // the whole session, so periodic refetching isn't needed.
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
    </SessionProvider>
  );
}
