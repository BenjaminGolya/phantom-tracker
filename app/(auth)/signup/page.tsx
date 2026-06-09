"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { PasswordRules } from "@/components/auth/password-rules";
import { isStrongPassword } from "@/lib/password";
import { useT } from "@/lib/i18n/context";
import { GoogleButton } from "@/components/auth/google-button";

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
          <li>Don&apos;t misuse the service: no illegal, abusive, or automated/bulk misuse.</li>
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
          <li><strong>Email:</strong> used for verification, a welcome message, and (only if you opt in) product updates.</li>
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
  const { status } = useSession();
  const t = useT();

  // Already signed in → no need to register again.
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

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
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors mb-6">
          <ArrowLeft size={14} /> {t("common.backToHome")}
        </Link>

        <div className="flex flex-col items-center mb-8 gap-3">
          <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Phantom Tracker</h1>
            <p className="text-sm text-muted mt-1">{t("auth.signUpTitle")}</p>
          </div>
        </div>

        <GoogleButton />

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
          <PasswordRules value={password} />

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
                <Link href="/tos" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
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
            disabled={loading || !acceptedTerms || !isStrongPassword(password)}
            className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {t("common.getStarted")}
          </button>
          {!acceptedTerms && (
            <p className="text-[11px] text-muted text-center">Accept the terms to continue.</p>
          )}
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("common.signIn")}
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
