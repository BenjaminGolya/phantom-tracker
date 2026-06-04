"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Ghost, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const password = params.get("password") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(i: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      setLoading(false);
      return;
    }

    // Auto-login if password was passed in params
    if (password) {
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } else {
      router.push("/login?verified=1");
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError("");
    // Re-hitting /api/auth/register with same email regenerates code
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    if (res.ok) {
      setResent(true);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to resend");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center phantom-glow">
            <Ghost size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted mt-1">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-medium text-white mt-0.5">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 6-digit input */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-mono font-bold bg-surface border border-border rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                style={{ caretColor: "transparent" }}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {resent && (
            <p className="text-green-400 text-sm text-center">New code sent — check your inbox.</p>
          )}

          <button
            type="submit"
            disabled={loading || digits.join("").length < 6}
            className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify email
          </button>
        </form>

        {/* Resend */}
        <p className="text-center text-sm text-muted mt-5">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>

        <div className="flex justify-center mt-4">
          <Link href="/signup" className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
            <ArrowLeft size={12} /> Back to sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
