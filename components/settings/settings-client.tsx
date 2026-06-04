"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, Download, LogOut, Ghost, Camera, Trash2, Bell, BellRing, Smartphone } from "lucide-react";
import { usePush } from "@/lib/use-push";

interface SettingsClientProps {
  user: { id: string; name: string | null; email: string; image: string | null };
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

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const push = usePush();
  const [name, setName] = useState(user?.name ?? "");
  const [image, setImage] = useState<string | null>(user?.image ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = (user?.name ?? user?.email ?? "U")?.[0]?.toUpperCase() ?? "U";

  async function handleTest() {
    setTestMsg("Sending…");
    const ok = await push.sendTest();
    setTestMsg(ok ? "Sent! Check your notifications." : "Failed — try re-enabling.");
    setTimeout(() => setTestMsg(""), 4000);
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

  async function handleExport() {
    const res = await fetch("/api/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phantom-tracker-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-28 lg:pb-6">
      <h1 className="text-lg font-semibold">Settings</h1>

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
        </h2>
        <p className="text-xs text-muted mb-4">
          Get a push notification when a habit&apos;s reminder time arrives.
        </p>

        {push.iosNeedsInstall ? (
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

      {/* Data */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-4">Data</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export data</p>
              <p className="text-xs text-muted">Download all your habits as CSV</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-border text-sm text-white rounded-lg border border-border transition-colors"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>
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
