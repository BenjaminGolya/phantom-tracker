"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { GhostLogo } from "@/components/brand/ghost-mark";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors mb-6">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="flex flex-col items-center mb-8 gap-3">
          <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted mt-1">We&apos;ll email you a reset link.</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-3">
              <MailCheck size={22} className="text-green-400" />
            </div>
            <p className="text-sm text-white mb-1">Check your inbox</p>
            <p className="text-xs text-muted mb-6">
              If an account exists for <span className="text-white">{email}</span>, a reset link is on its way. It expires in 1 hour.
            </p>
            <Link href="/login" className="text-sm text-primary hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Send reset link
              </button>
            </form>
            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-white transition-colors mt-6">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
