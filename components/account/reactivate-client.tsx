"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, AlertTriangle, PauseCircle } from "lucide-react";
import { GhostLogo } from "@/components/brand/ghost-mark";
import { clearAccentTheme } from "@/lib/theme";

export function ReactivateClient({
  name,
  email,
  pendingDeletion,
  daysLeft,
  purgeOn,
}: {
  name: string | null;
  email: string;
  pendingDeletion: boolean;
  daysLeft: number | null;
  purgeOn: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function reactivate() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/account/reactivate", { method: "POST" });
      if (res.ok) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setErr("Couldn't reactivate. Please try again.");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const purgeLabel = purgeOn
    ? new Date(purgeOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 text-center">
        <div className="flex flex-col items-center mb-5 gap-3">
          <GhostLogo size={56} rounded="rounded-2xl" className="phantom-glow" />
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              pendingDeletion
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-primary/10 border-primary/30 text-primary"
            }`}
          >
            {pendingDeletion ? <AlertTriangle size={12} /> : <PauseCircle size={12} />}
            {pendingDeletion ? "Scheduled for deletion" : "Account disabled"}
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">
          {pendingDeletion ? "Your account is scheduled for deletion" : "Your account is disabled"}
        </h1>

        {pendingDeletion ? (
          <p className="text-sm text-muted mb-1">
            We&apos;re keeping your data for <span className="text-white font-medium">{daysLeft} more day{daysLeft === 1 ? "" : "s"}</span>.
            Reactivate before <span className="text-white font-medium">{purgeLabel}</span> to keep everything. After that it&apos;s permanently erased.
          </p>
        ) : (
          <p className="text-sm text-muted mb-1">
            Your habits and history are safe. Reactivate to pick up right where you left off.
          </p>
        )}
        <p className="text-xs text-muted mb-6">Signed in as {name ? `${name} · ` : ""}{email}</p>

        {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

        <button
          onClick={reactivate}
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:bg-primary-dim text-white text-sm font-semibold rounded-lg transition-all hover:shadow-glow disabled:opacity-60 flex items-center justify-center gap-2 mb-2.5"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Reactivate my account
        </button>
        <button
          onClick={() => { clearAccentTheme(); signOut({ callbackUrl: "/" }); }}
          className="w-full py-2.5 text-sm text-muted hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
