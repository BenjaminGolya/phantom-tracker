import Link from "next/link";
import { cookies } from "next/headers";
import { Home } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { translate } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

export default function NotFound() {
  const raw = cookies().get(LANG_COOKIE)?.value;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-5 overflow-hidden">
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      <div className="relative text-center max-w-md">
        <div className="flex items-center justify-center mb-6">
          <GhostLogo size={72} rounded="rounded-3xl" className="phantom-glow phantom-bounce" />
        </div>
        <p className="text-6xl font-bold font-mono tracking-tight bg-gradient-to-r from-primary to-phantom-300 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="text-xl font-semibold mt-4">{translate(lang, "nf.title")}</h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">{translate(lang, "nf.desc")}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-7 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all hover:shadow-glow"
        >
          <Home size={15} /> {translate(lang, "nf.home")}
        </Link>
      </div>
    </div>
  );
}
