"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Don't refetch the session on every window focus / interval — it caused
      // a slow /api/auth/session call on each tab switch. The JWT is valid for
      // the whole session, so periodic refetching isn't needed.
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
