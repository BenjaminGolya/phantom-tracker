import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LANG_COOKIE, DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Phantom Tracker",
  description: "Track your habits in the dark.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Controls the name shown under the icon when added to an iOS Home Screen.
  appleWebApp: {
    capable: true,
    title: "Phantom Tracker",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieLang = cookies().get(LANG_COOKIE)?.value;
  const lang = isLocale(cookieLang) ? cookieLang : DEFAULT_LOCALE;
  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-white`}>
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
