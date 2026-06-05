"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Ghost, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PolicyKey = "terms" | "privacy" | "newsletter";

const POLICIES: Record<PolicyKey, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "Terms of Service",
    body: (
      <>
        <p>By creating an account you agree to use Phantom Tracker responsibly. In short:</p>
        <ul>
          <li>The app is provided <strong>as-is</strong>, for personal habit tracking.</li>
          <li>You&apos;re responsible for your account, your password, and the data you add.</li>
          <li>Don&apos;t misuse the service — no illegal, abusive, or automated/bulk misuse.</li>
          <li>We may add, change, or remove features over time.</li>
          <li>We aim for high uptime but can&apos;t guarantee the service is always available.</li>
        </ul>
        <p>If you don&apos;t agree with these terms, please don&apos;t create an account.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>We only collect what we need to run your account:</p>
        <ul>
          <li><strong>Account:</strong> your email, optional name, and optional profile picture.</li>
          <li><strong>Your data:</strong> the habits and check-ins you create.</li>
          <li><strong>Email:</strong> used for verification, a welcome message, and — only if you opt in — product updates.</li>
          <li><strong>Notifications:</strong> if you enable reminders, we store a push subscription to deliver them.</li>
        </ul>
        <p>We <strong>never sell your data</strong>. You can delete your account and data at any time from Settings.</p>
      </>
    ),
  },
  newsletter: {
    title: "Updates & Offers",
    body: (
      <>
        <p>Opt in to occasionally hear from us about:</p>
        <ul>
          <li>✨ New features and improvements</li>
          <li>🎁 Bonuses, tips, and habit-building ideas</li>
          <li>🚀 Upcoming plans, upgrades, and special offers</li>
        </ul>
        <p>It&apos;s completely optional, low-volume, and you can <strong>unsubscribe anytime</strong>. You&apos;ll still get essential account emails (like verification) either way.</p>
      </>
    ),
  },
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [policy, setPolicy] = useState<PolicyKey | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, acceptedTerms, newsletterOptIn }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ email, password });
    router.push(`/verify?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center phantom-glow">
            <Ghost size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Phantom Tracker</h1>
            <p className="text-sm text-muted mt-1">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />

          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
              />
              <span className="text-xs text-muted leading-snug">
                I agree to the{" "}
                <button type="button" onClick={() => setPolicy("terms")} className="text-primary hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => setPolicy("privacy")} className="text-primary hover:underline">
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
              />
              <span className="text-xs text-muted leading-snug">
                Send me product updates, new features, bonuses, and plan offers.{" "}
                <button type="button" onClick={() => setPolicy("newsletter")} className="text-primary hover:underline">
                  Read more
                </button>
              </span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create account
          </button>
          {!acceptedTerms && (
            <p className="text-[11px] text-muted text-center">Accept the terms to continue.</p>
          )}
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>

      {/* Read-more modal */}
      <AnimatePresence>
        {policy && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setPolicy(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-10 max-h-[85dvh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h2 className="font-semibold text-sm">{POLICIES[policy].title}</h2>
                <button onClick={() => setPolicy(null)} className="text-muted hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 text-sm text-muted leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-white">
                {POLICIES[policy].body}
              </div>
              <div className="px-5 py-3 border-t border-border shrink-0">
                <button
                  onClick={() => setPolicy(null)}
                  className="w-full py-2.5 bg-surface-2 hover:bg-border text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
