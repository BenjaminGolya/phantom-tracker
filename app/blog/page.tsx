import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { POSTS } from "@/lib/blog/posts";

const SITE_URL = "https://phantomtracker.io";

export const metadata: Metadata = {
  title: "Blog — Habit-building guides & tips",
  description:
    "Practical, science-backed guides on building habits, streaks, and consistency from the Phantom Tracker team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Phantom Tracker Blog — habit-building guides",
    description: "Practical guides on building habits, streaks, and consistency.",
  },
};

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
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
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-sm text-muted mt-2 mb-8">Guides on building habits, streaks, and consistency.</p>

        <div className="space-y-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group"
            >
              <div className="border-b border-border/60">{p.hero}</div>
              <div className="p-5">
              <div className="flex items-center gap-2 text-[11px] text-muted mb-1.5">
                <time>{new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
                <span>·</span>
                <span>{p.readingMins} min read</span>
              </div>
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{p.title}</h2>
              <p className="text-sm text-muted leading-relaxed mt-1.5">{p.description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3">
                Read more <ArrowRight size={13} />
              </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
