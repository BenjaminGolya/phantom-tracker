import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { POSTS, getPost } from "@/lib/blog/posts";

const SITE_URL = "https://phantomtracker.io";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Phantom Tracker" },
    publisher: { "@type": "Organization", name: "Phantom Tracker", url: SITE_URL },
    mainEntityOfPage: url,
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[140px]" />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GhostLogo size={26} className="phantom-glow" />
            <span className="font-semibold text-sm tracking-tight">Phantom Tracker</span>
          </Link>
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
            <ArrowLeft size={15} /> Blog
          </Link>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-5 py-12">
        <article>
          <div className="flex items-center gap-2 text-[11px] text-muted mb-3">
            <time>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
            <span>·</span>
            <span>{post.readingMins} min read</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">{post.title}</h1>
          <p className="text-base text-muted mt-3 leading-relaxed">{post.description}</p>
          <div className="mt-6 rounded-2xl overflow-hidden border border-border">{post.hero}</div>
          <div className="mt-8 border-t border-border/60 pt-6">{post.content}</div>
        </article>

        {/* CTA */}
        <div className="mt-12 bg-surface border border-primary/20 rounded-2xl p-6 text-center">
          <GhostLogo size={40} rounded="rounded-2xl" className="phantom-glow mx-auto mb-3" />
          <h2 className="text-lg font-bold">Start building better habits</h2>
          <p className="text-sm text-muted mt-1.5 mb-5">Free, on every device. Streaks, levels, and a living world that grows with you.</p>
          <Link href="/signup" className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all hover:shadow-glow">
            Get started for free <ChevronRight size={15} />
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60">
          <Link href="/blog" className="text-sm text-primary hover:underline">← All articles</Link>
        </div>
      </main>
    </div>
  );
}
