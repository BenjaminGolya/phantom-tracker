"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Download, LogOut, Ghost } from "lucide-react";

interface SettingsClientProps {
  user: { id: string; name: string | null; email: string };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-6">
      <h1 className="text-lg font-semibold">Settings</h1>

      {/* Profile */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-4">Profile</h2>
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
              value={user.email}
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
