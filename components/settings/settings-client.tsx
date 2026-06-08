"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, Download, Upload, LogOut, Camera, Trash2, Bell, BellRing, Smartphone, Sparkles, Lock, Crown, PauseCircle, LifeBuoy, Send, ImagePlus, ShieldCheck, Globe } from "lucide-react";
import { usePush } from "@/lib/use-push";
import { GhostLogo, GhostAvatar } from "@/components/brand/ghost-mark";
import { APP_VERSION, LATEST, CHANGELOG } from "@/lib/version";
import { useLang } from "@/lib/i18n/context";
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS } from "@/lib/i18n/config";

interface SettingsClientProps {
  user: { id: string; name: string | null; email: string; image: string | null };
  pro?: boolean;
  proSince?: string | null;
  trialEndsAt?: string | null;
  hasBilling?: boolean;
  pendingEmail?: string | null;
  twoFactorEnabled?: boolean;
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

export function SettingsClient({ user, pro = false, proSince = null, trialEndsAt = null, hasBilling = false, pendingEmail = null, twoFactorEnabled = false }: SettingsClientProps) {
  const trialDaysLeft = trialEndsAt && new Date(trialEndsAt).getTime() > Date.now() ? daysUntil(trialEndsAt) : null;
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const push = usePush();
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState("");
  const [confirm, setConfirm] = useState<null | "disable" | "delete">(null);
  const [acting, setActing] = useState(false);
  const [actErr, setActErr] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [fbType, setFbType] = useState<"bug" | "question" | "feedback">("bug");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);
  const [fbResult, setFbResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [fbFiles, setFbFiles] = useState<{ name: string; dataUrl: string; contentType: string }[]>([]);
  const fbFileRef = useRef<HTMLInputElement>(null);
  const [twoFA, setTwoFA] = useState(twoFactorEnabled);
  const [twoFABusy, setTwoFABusy] = useState(false);

  async function toggle2FA() {
    const next = !twoFA;
    setTwoFABusy(true);
    try {
      const res = await fetch("/api/account/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: next }),
      });
      if (res.ok) setTwoFA(next);
    } finally {
      setTwoFABusy(false);
    }
  }

  const FB_MAX_FILES = 3;
  const FB_MAX_MB = 5;
  const FB_ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  function pickScreenshots(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fbFileRef.current) fbFileRef.current.value = "";
    setFbResult(null);
    for (const file of files) {
      if (fbFiles.length >= FB_MAX_FILES) {
        setFbResult({ ok: false, text: `Up to ${FB_MAX_FILES} screenshots.` });
        break;
      }
      if (!FB_ALLOWED.includes(file.type)) {
        setFbResult({ ok: false, text: "Only PNG, JPG, WebP or GIF images." });
        continue;
      }
      if (file.size > FB_MAX_MB * 1024 * 1024) {
        setFbResult({ ok: false, text: `Each image must be under ${FB_MAX_MB} MB.` });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFbFiles((prev) =>
          prev.length >= FB_MAX_FILES
            ? prev
            : [...prev, { name: file.name, dataUrl: reader.result as string, contentType: file.type }]
        );
      };
      reader.readAsDataURL(file);
    }
  }

  async function submitFeedback() {
    if (fbMessage.trim().length < 5) {
      setFbResult({ ok: false, text: "Please add a bit more detail." });
      return;
    }
    setFbSending(true);
    setFbResult(null);
    try {
      const attachments = fbFiles.map((f) => ({
        filename: f.name,
        contentType: f.contentType,
        content: f.dataUrl.split(",")[1] ?? "", // strip "data:...;base64,"
      }));
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: fbType, message: fbMessage.trim(), attachments }),
      });
      const data = await res.json();
      if (res.ok) {
        setFbResult({ ok: true, text: "Thanks! Your message has been sent. ✓" });
        setFbMessage("");
        setFbFiles([]);
      } else {
        setFbResult({ ok: false, text: data?.message ?? "Couldn't send — please try again." });
      }
    } catch {
      setFbResult({ ok: false, text: "Network error. Please try again." });
    } finally {
      setFbSending(false);
    }
  }

  async function submitEmailChange() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailMsg("");
    try {
      const res = await fetch("/api/user/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMsg(`✓ Confirmation sent to ${data.pendingEmail}. Open it and tap "Confirm new email" to finish.`);
        setChangingEmail(false);
        setNewEmail("");
        router.refresh();
      } else {
        setEmailMsg(data?.message ?? "Couldn't start the email change. Please try again.");
      }
    } catch {
      setEmailMsg("Network error. Please try again.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleAccountAction() {
    if (!confirm) return;
    setActing(true);
    setActErr("");
    try {
      const res = await fetch(`/api/account/${confirm}`, { method: "POST" });
      if (res.ok) {
        // Both actions log the user out; reactivation happens on next sign-in.
        await signOut({ callbackUrl: "/login" });
        return;
      }
      setActErr("Something went wrong. Please try again.");
    } catch {
      setActErr("Network error. Please try again.");
    } finally {
      setActing(false);
    }
  }

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
      <h1 className="text-lg font-semibold">{t("settings.title")}</h1>

      {justUpgraded && (
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-primary/40 bg-primary/10 text-sm text-primary">
          <Sparkles size={15} /> Welcome to Pro — your perks are now active. Thank you! ✦
        </div>
      )}

      {/* Billing / Plan */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Crown size={15} className="text-primary" /> {t("settings.plan")}
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
                    ? `${t("set.trialEndsIn")} ${trialDaysLeft} ${trialDaysLeft === 1 ? t("dash.day") : t("dash.days")} · ${t("set.trialThen")}`
                    : proSince
                      ? `${t("set.memberSince")} ${new Date(proSince).toLocaleDateString()}`
                      : t("set.thanksPro")}
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
                  {t("set.complimentary")}
                </span>
              )}
            </div>
            {portalErr && <p className="text-xs text-red-400 mt-2">{portalErr}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 mt-3">
            <div>
              <p className="text-sm font-medium">Free</p>
              <p className="text-xs text-muted mt-0.5">{t("set.upgradeBlurb")}</p>
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
        <h2 className="text-sm font-medium mb-4">{t("settings.profile")}</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <GhostAvatar size={64} className="border-2 border-primary/30" />
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
              {image ? t("set.changePhoto") : t("set.uploadPhoto")}
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
            <label className="text-xs text-muted block mb-1.5">{t("set.displayName")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Email</label>
            {!changingEmail ? (
              <>
                <div className="flex gap-2">
                  <input
                    value={user?.email ?? ""}
                    disabled
                    className="flex-1 min-w-0 px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => { setChangingEmail(true); setEmailMsg(""); }}
                    className="px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors shrink-0"
                  >
                    Change
                  </button>
                </div>
                {pendingEmail && (
                  <p className="text-[11px] text-amber-300 mt-1.5">
                    {t("set.pending")}: <span className="font-medium">{pendingEmail}</span> — {t("set.checkInbox")}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@email.com"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={submitEmailChange}
                    disabled={emailSaving || !newEmail.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {emailSaving && <Loader2 size={13} className="animate-spin" />}
                    {t("set.sendConfirmation")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChangingEmail(false); setNewEmail(""); }}
                    className="px-3 py-2 text-sm text-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-muted">{t("set.emailChangeHint")}</p>
              </div>
            )}
            {emailMsg && <p className="text-[11px] text-muted mt-1.5">{emailMsg}</p>}
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
          <Bell size={15} className="text-primary" /> {t("settings.reminders")}
          {!pro && (
            <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
              <Lock size={9} /> PRO
            </span>
          )}
        </h2>
        <p className="text-xs text-muted mb-4">
          {t("set.remindersDesc")}
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
          <p className="text-xs text-muted">{t("set.notifUnsupported")}</p>
        ) : push.permission === "denied" ? (
          <p className="text-xs text-red-400">
            {t("set.notifBlocked")}
          </p>
        ) : push.subscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <BellRing size={15} /> {t("set.notifEnabled")}
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
            {t("set.enableNotif")}
          </button>
        )}
      </div>

      {/* Data — Pro */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          {t("settings.data")}
          {!pro && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
              <Lock size={9} /> PRO
            </span>
          )}
        </h2>
        <p className="text-xs text-muted mb-4">{t("set.dataDesc")}</p>

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
                <p className="text-sm font-medium">{t("set.export")}</p>
                <p className="text-xs text-muted">{t("set.exportDesc")}</p>
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
                <p className="text-sm font-medium">{t("set.import")}</p>
                <p className="text-xs text-muted">{t("set.importDesc")}</p>
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

      {/* Language */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Globe size={15} className="text-primary" /> {t("settings.language")}
        </h2>
        <p className="text-xs text-muted mb-4">{t("settings.languageHint")}</p>
        <div className="flex gap-2 flex-wrap">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                lang === l ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface-2 border-border text-muted hover:text-white"
              }`}
            >
              <span>{LOCALE_FLAGS[l]}</span> {LOCALE_NAMES[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <ShieldCheck size={15} className="text-primary" /> {t("settings.security")}
        </h2>
        <p className="text-xs text-muted mb-4">{t("set.securityDesc")}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t("settings.twoFA")}</p>
            <p className="text-xs text-muted">
              {twoFA
                ? t("set.twoFAOn")
                : t("set.twoFAOff")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={twoFA}
            onClick={toggle2FA}
            disabled={twoFABusy}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${twoFA ? "bg-primary" : "bg-surface-2 border border-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${twoFA ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Help & feedback */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <LifeBuoy size={15} className="text-primary" /> {t("settings.help")}
        </h2>
        <p className="text-xs text-muted mb-4">{t("set.helpDesc")}</p>

        <div className="flex gap-2 mb-3">
          {([
            { v: "bug", label: t("set.bug") },
            { v: "question", label: t("set.question") },
            { v: "feedback", label: t("set.feedback") },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFbType(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                fbType === opt.v ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-white border border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          value={fbMessage}
          onChange={(e) => setFbMessage(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={
            fbType === "bug"
              ? t("set.bugPlaceholder")
              : fbType === "question"
                ? t("set.questionPlaceholder")
                : t("set.feedbackPlaceholder")
          }
          className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
        />

        {/* Screenshot attachments */}
        <div className="mt-2">
          <input
            ref={fbFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={pickScreenshots}
            className="hidden"
          />
          <div className="flex items-center gap-2 flex-wrap">
            {fbFiles.map((f, i) => (
              <div key={i} className="relative group/att">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.dataUrl} alt={f.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => setFbFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center"
                  aria-label="Remove screenshot"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
            {fbFiles.length < FB_MAX_FILES && (
              <button
                type="button"
                onClick={() => fbFileRef.current?.click()}
                className="w-12 h-12 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted hover:text-primary flex items-center justify-center transition-colors"
                title="Attach screenshot"
              >
                <ImagePlus size={16} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted mt-1">{t("set.imagesNote")}</p>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          {fbResult ? (
            <p className={`text-xs ${fbResult.ok ? "text-green-400" : "text-red-400"}`}>{fbResult.text}</p>
          ) : (
            <span className="text-[11px] text-muted">{t("set.repliesNote")}</span>
          )}
          <button
            type="button"
            onClick={submitFeedback}
            disabled={fbSending || fbMessage.trim().length < 5}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dim text-white text-sm font-medium rounded-lg transition-all hover:shadow-glow disabled:opacity-50 shrink-0"
          >
            {fbSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {t("set.send")}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-red-900/30 rounded-xl p-5">
        <h2 className="text-sm font-medium text-red-400 mb-4">{t("settings.account")}</h2>
        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-900/30 transition-colors"
          >
            <LogOut size={13} />
            {t("common.signOut")}
          </button>

          <div className="border-t border-red-900/20 pt-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t("set.disableAccount")}</p>
                <p className="text-xs text-muted">{t("set.disableAccountDesc")}</p>
              </div>
              <button
                onClick={() => setConfirm("disable")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-700/30 transition-colors shrink-0"
              >
                <PauseCircle size={14} /> {t("set.disable")}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t("set.deleteAccount")}</p>
                <p className="text-xs text-muted">{t("set.deleteAccountDesc")}</p>
              </div>
              <button
                onClick={() => setConfirm("delete")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-900/30 transition-colors shrink-0"
              >
                <Trash2 size={14} /> {t("form.delete")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disable / Delete confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => !acting && setConfirm(null)} />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10">
            <div className="flex items-center gap-2 mb-2">
              {confirm === "delete"
                ? <Trash2 size={16} className="text-red-400" />
                : <PauseCircle size={16} className="text-amber-300" />}
              <h3 className="text-sm font-semibold">
                {confirm === "delete" ? t("set.deleteConfirmTitle") : t("set.disableConfirmTitle")}
              </h3>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              {confirm === "delete" ? t("set.deleteConfirmBody") : t("set.disableConfirmBody")}
            </p>
            {actErr && <p className="text-xs text-red-400 mb-3">{actErr}</p>}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAccountAction}
                disabled={acting}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 ${
                  confirm === "delete" ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {acting && <Loader2 size={13} className="animate-spin" />}
                {confirm === "delete" ? t("set.deleteAccount") : t("set.disableAccount")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About / version */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <GhostLogo size={16} /> Phantom Tracker
          </h2>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
            v{APP_VERSION}
          </span>
        </div>

        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{t("set.latestUpdate")}</p>
          <p className="text-xs text-white leading-relaxed">{LATEST.summary}</p>
          <p className="text-[10px] text-muted mt-0.5">{LATEST.date}</p>
        </div>

        <details className="group">
          <summary className="text-xs text-primary cursor-pointer list-none flex items-center gap-1 select-none">
            <span className="group-open:hidden">{t("set.showChangelog")}</span>
            <span className="hidden group-open:inline">{t("set.hideChangelog")}</span>
          </summary>
          <ul className="mt-2 space-y-2 border-t border-border pt-2">
            {CHANGELOG.map((c) => (
              <li key={c.version} className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary">v{c.version}</span>
                  <span className="text-[10px] text-muted">{c.date}</span>
                </div>
                <p className="text-muted leading-relaxed">{c.summary}</p>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Footer note */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted">{t("set.tagline")}</p>
      </div>
    </div>
  );
}
