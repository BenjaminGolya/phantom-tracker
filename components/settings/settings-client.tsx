"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, Download, Upload, LogOut, Ghost, Camera, Trash2, Bell, BellRing, Smartphone, Sparkles, Lock, Crown } from "lucide-react";
import { usePush } from "@/lib/use-push";

interface SettingsClientProps {
  user: { id: string; name: string | null; email: string; image: string | null };
  pro?: boolean;
  proSince?: string | null;
  trialEndsAt?: string | null;
  hasBilling?: boolean;
}

// Whole days remaining until a date (rounded up). Returns 0 if already past.
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

// Resize an image file to a square <=256px JPEG data URL to keep it small.
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        // center-crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SettingsClient({ user, pro = false, proSince = null, trialEndsAt = null, hasBilling = false }: SettingsClientProps) {
  const trialDaysLeft = trialEndsAt && new Date(trialEndsAt).getTime() > Date.now() ? daysUntil(trialEndsAt) : null;
  const router = useRouter();
  const push = usePush();
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState("");

  // Show a thank-you banner after returning from Stripe checkout (?upgraded=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setJustUpgraded(true);
      router.refresh();
      window.history.replaceState({}, "", "/settings");
    }
  }, [router]);

  async function openPortal() {
    setPortalLoading(true);
    setPortalErr("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalErr(
        data?.error === "no_customer"
          ? "No billing account is linked — there's nothing to manage."
          : "Billing portal is unavailable right now. Please try again later."
      );
    } catch {
      setPortalErr("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }
  const [name, setName] = useState(user?.name ?? "");
  const [image, setImage] = useState<string | null>(user?.image ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const initial = (user?.name ?? user?.email ?? "U")?.[0]?.toUpperCase() ?? "U";

  async function handleTest() {
    setTestMsg("Sending…");
    const r = await push.sendTest();
    if (r.ok && (r.sent ?? 0) > 0) {
      setTestMsg("Sent ✓ — check your notifications.");
    } else if (r.total === 0 || r.error) {
      setTestMsg("No device subscribed — turn it off and on again.");
    } else {
      const code = r.errors?.[0]?.statusCode;
      setTestMsg(`Delivery failed${code ? ` (code ${code})` : ""} — the push was rejected.`);
    }
    setTimeout(() => setTestMsg(""), 7000);
  }

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToAvatar(file);
      setImage(dataUrl);
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      router.refresh(); // update topbar/sidebar avatar
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    setImage(null);
    await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: null }),
    });
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport(format: "csv" | "json" = "csv") {
    const res = await fetch(`/api/export${format === "json" ? "?format=json" : ""}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "json" ? "phantom-tracker-backup.json" : "phantom-tracker-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (importRef.current) importRef.current.value = "";
    if (!file) return;
    setImportMsg("Importing…");
    try {
      const text = await file.text();
      JSON.parse(text); // fail fast on bad files
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`Imported ${data.habitsCreated} habit(s) and ${data.logsImported} log(s).`);
        router.refresh();
      } else {
        setImportMsg(data?.message ?? "Import failed — make sure it's a Phantom Tracker backup file.");
      }
    } catch {
      setImportMsg("Couldn't read that file — it must be a valid .json backup.");
    } finally {
      setTimeout(() => setImportMsg(""), 8000);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-28 lg:pb-6">
      <h1 className="text-lg font-semibold">Settings</h1>

      {justUpgraded && (
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-primary/40 bg-primary/10 text-sm text-primary">
          <Sparkles size={15} /> Welcome to Pro — your perks are now active. Thank you! ✦
        </div>
      )}

      {/* Billing / Plan */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Crown size={15} className="text-primary" /> Plan
        </h2>
        {pro ? (
          <>
            <div className="flex items-center justify-between gap-3 mt-3">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  Pro
                  <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/20 border border-primary/40">
                    {trialDaysLeft !== null ? "TRIAL" : "ACTIVE"}
                  </span>
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {trialDaysLeft !== null
                    ? `Free trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} · then billing starts`
                    : proSince
                      ? `Member since ${new Date(proSince).toLocaleDateString()}`
                      : "Thanks for supporting Phantom Tracker."}
                </p>
              </div>
              {hasBilling ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {portalLoading && <Loader2 size={13} className="animate-spin" />}
                  Manage
                </button>
              ) : (
                <span className="text-[11px] text-muted text-right shrink-0 max-w-[9rem]">
                  Complimentary Pro — no billing to manage
                </span>
              )}
            </div>
            {portalErr && <p className="text-xs text-red-400 mt-2">{portalErr}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 mt-3">
            <div>
              <p className="text-sm font-medium">Free</p>
              <p className="text-xs text-muted mt-0.5">Upgrade for unlimited habits, reminders & more.</p>
            </div>
            <Link
              href="/pricing"
              className="px-3.5 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow flex items-center gap-1.5 shrink-0"
            >
              <Sparkles size={13} /> Go Pro
            </Link>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-4">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-semibold text-primary">
                {initial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors disabled:opacity-50"
            >
              <Camera size={13} />
              {image ? "Change photo" : "Upload photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1.5">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Email</label>
            <input
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-muted"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Bell size={15} className="text-primary" /> Reminders
          {!pro && (
            <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
              <Lock size={9} /> PRO
            </span>
          )}
        </h2>
        <p className="text-xs text-muted mb-4">
          Get a push notification when a habit&apos;s reminder time arrives.
        </p>

        {!pro ? (
          <Link
            href="/pricing"
            className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-primary/30 bg-primary/8 hover:bg-primary/15 transition-colors"
          >
            <Sparkles size={16} className="text-primary shrink-0" />
            <p className="text-xs text-muted">
              <span className="text-primary font-medium">Upgrade to Pro</span> to enable timed push reminders for your habits.
            </p>
          </Link>
        ) : push.iosNeedsInstall ? (
          <div className="flex items-start gap-2.5 px-3 py-3 bg-surface-2 border border-border rounded-lg">
            <Smartphone size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted">
              On iPhone, add Phantom Tracker to your <span className="text-white">Home Screen</span> first:
              tap <span className="text-white">Share → Add to Home Screen</span>, then open it from the
              new icon and come back here to turn on notifications.
            </p>
          </div>
        ) : !push.supported ? (
          <p className="text-xs text-muted">Notifications aren&apos;t supported on this browser.</p>
        ) : push.permission === "denied" ? (
          <p className="text-xs text-red-400">
            Notifications are blocked in your browser settings. Re-enable them for this site, then refresh.
          </p>
        ) : push.subscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <BellRing size={15} /> Notifications enabled on this device
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleTest}
                className="px-3 py-1.5 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors"
              >
                Send test
              </button>
              <button
                onClick={push.unsubscribe}
                disabled={push.busy}
                className="px-3 py-1.5 text-sm text-muted hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Disable
              </button>
              {testMsg && <span className="text-xs text-muted">{testMsg}</span>}
            </div>
          </div>
        ) : (
          <button
            onClick={push.subscribe}
            disabled={push.busy}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50"
          >
            {push.busy ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            Enable notifications
          </button>
        )}
      </div>

      {/* Data — Pro */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          Data
          {!pro && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
              <Lock size={9} /> PRO
            </span>
          )}
        </h2>
        <p className="text-xs text-muted mb-4">Export a backup of your habits, or import one into this account.</p>

        {!pro ? (
          <Link
            href="/pricing"
            className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-primary/30 bg-primary/8 hover:bg-primary/15 transition-colors"
          >
            <Sparkles size={16} className="text-primary shrink-0" />
            <p className="text-xs text-muted">
              <span className="text-primary font-medium">Upgrade to Pro</span> to export and import your data.
            </p>
          </Link>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Export</p>
                <p className="text-xs text-muted">CSV for spreadsheets, or a full JSON backup</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors"
                >
                  <Download size={13} /> CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors"
                >
                  <Download size={13} /> JSON
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium">Import</p>
                <p className="text-xs text-muted">Restore from a .json backup (merges, never deletes)</p>
              </div>
              <input ref={importRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors shrink-0"
              >
                <Upload size={13} /> Import
              </button>
            </div>
            {importMsg && <p className="text-xs text-muted">{importMsg}</p>}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-red-900/30 rounded-xl p-5">
        <h2 className="text-sm font-medium text-red-400 mb-4">Account</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-900/30 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>

      {/* About */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted flex items-center justify-center gap-1.5"><Ghost size={11} className="text-primary" /> Phantom Tracker — v1.0.0</p>
        <p className="text-xs text-muted mt-1">Dark mode only. Built for consistency.</p>
      </div>
    </div>
  );
}
