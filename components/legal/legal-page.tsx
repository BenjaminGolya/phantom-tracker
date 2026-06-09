import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";

// Shared shell for the public legal pages (Privacy, Terms). Server component.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GhostLogo size={26} className="phantom-glow" />
            <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted mt-2">Last updated: {updated}</p>

        <div className="legal mt-8 space-y-6 text-sm text-muted leading-relaxed">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex items-center gap-4 text-xs text-muted">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/tos" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}

// Section heading helper for consistent styling.
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
