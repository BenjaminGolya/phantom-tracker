"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { useT } from "@/lib/i18n/context";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const justVerified = params.get("verified") === "1";
  const emailChanged = params.get("emailChanged") === "1";
  const passwordReset = params.get("reset") === "1";
  const emailChangeIssue = params.get("emailChange"); // invalid | expired | taken | error
  const emailParam = params.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [code, setCode] = useState("");
  const t = useT();

  // Already signed in → go to the dashboard. The one exception: an email link
  // for a DIFFERENT account (?email=) opened on a device logged into another
  // account — there we keep the form so they can switch accounts.
  useEffect(() => {
    if (status !== "authenticated") return;
    const differentAccountLink = emailParam && session?.user?.email !== emailParam;
    if (!differentAccountLink) router.replace("/dashboard");
  }, [status, session, emailParam, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Step 2: a 2FA code is being entered → sign in with it.
    if (needs2fa) {
      const res = await signIn("credentials", { email, password, code, redirect: false });
      setLoading(false);
      if (res?.error) setError("That code isn't right or has expired. Try again.");
      else router.push("/");
      return;
    }

    // Step 1: verify credentials; find out if 2FA is needed (and send the code).
    try {
      const pre = await fetch("/api/auth/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await pre.json();
      if (!data.valid) {
        setLoading(false);
        setError("Invalid email or password");
        return;
      }
      if (data.twoFactor) {
        setLoading(false);
        setNeeds2fa(true);
        return;
      }
      // No 2FA → complete sign in.
      const res = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (res?.error) setError("Invalid email or password");
      else router.push("/");
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors mb-6">
          <ArrowLeft size={14} /> {t("common.backToHome")}
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Phantom Tracker</h1>
            <p className="text-sm text-muted mt-1">{t("auth.signInTitle")}</p>
          </div>
        </div>

        {justVerified && (
          <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
            ✓ Email verified — you can now sign in
          </div>
        )}

        {emailChanged && (
          <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
            ✓ Email updated — sign in with your new address
          </div>
        )}

        {passwordReset && (
          <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
            ✓ Password updated — sign in with your new password
          </div>
        )}

        {emailChangeIssue && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {emailChangeIssue === "expired"
              ? "That email-change link has expired. Please request a new one."
              : emailChangeIssue === "taken"
                ? "That email is now in use by another account."
                : "That email-change link is invalid or already used."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={needs2fa}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
            />
          </div>

          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={needs2fa}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-10 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {needs2fa && (
            <div>
              <div className="mb-2 px-3 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary">
                We emailed a 6-digit code to <span className="font-medium">{email}</span>. Enter it below.
              </div>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-white tracking-[0.3em] font-mono text-center placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => { setNeeds2fa(false); setCode(""); setError(""); }}
                className="text-xs text-muted hover:text-white transition-colors mt-2"
              >
                ← Use a different account
              </button>
            </div>
          )}

          {!needs2fa && (
            <div className="text-right -mt-1">
              <Link href="/forgot" className="text-xs text-muted hover:text-primary transition-colors">
                {t("auth.forgot")}
              </Link>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {needs2fa ? t("auth.verifyAndSignIn") : t("common.signIn")}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="text-primary hover:underline">
            {t("common.getStarted")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
