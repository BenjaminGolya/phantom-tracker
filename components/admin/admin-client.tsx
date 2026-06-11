"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Shield, Search, MoreHorizontal, Crown, Ban, CheckCircle2,
  Pencil, Trash2, Users, Sparkles, X, Loader2, ChevronDown,
  Target, Flame, CheckCheck, Clock,
} from "lucide-react";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  pro: boolean;
  lifetime: boolean;
  proUntil: string | null;
  disabled: boolean;
  pendingDeletion: boolean;
  verified: boolean;
  habitCount: number;
  checkins: number;
  bestStreak: number;
  lastActive: string | null;
  createdAt: string;
}

type Action =
  | { kind: "disable" | "enable" | "revokePro" }
  | { kind: "grantPro"; data: { months?: number; lifetime?: boolean } }
  | { kind: "update"; data: { name?: string; email?: string } };

export function AdminClient({ users, selfId }: { users: AdminUserRow[]; selfId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [granting, setGranting] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const stats = useMemo(() => ({
    total: users.length,
    pro: users.filter((u) => u.pro).length,
    disabled: users.filter((u) => u.disabled || u.pendingDeletion).length,
  }), [users]);

  async function patch(id: string, action: Action) {
    setBusyId(id);
    setError(null);
    try {
      // API expects { action, data? } — map our Action's `kind` to `action`.
      const payload = "data" in action
        ? { action: action.kind, data: action.data }
        : { action: action.kind };
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Action failed.");
      setEditing(null);
      setGranting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusyId(null);
      setMenuId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/30">
          <Shield size={18} />
        </span>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Admin</h1>
          <p className="text-sm text-muted">Manage users and access.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Users size={16} className="text-primary" />} label="Total users" value={stats.total} />
        <StatCard icon={<Crown size={16} className="text-amber-400" />} label="Pro" value={stats.pro} />
        <StatCard icon={<Ban size={16} className="text-red-400" />} label="Disabled" value={stats.disabled} />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300/70 hover:text-red-200"><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name…"
          className="w-full pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Users */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header row (desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-surface-2/60 text-[11px] font-medium uppercase tracking-wider text-muted">
          <span>User</span>
          <span className="w-24 text-center">Plan</span>
          <span className="w-24 text-center">Status</span>
          <span className="w-16 text-center">Habits</span>
          <span className="w-24 text-right">Joined</span>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((u) => {
            const busy = busyId === u.id;
            const isSelf = u.id === selfId;
            const expanded = expandedId === u.id;
            return (
              <div key={u.id} className="px-4 py-3 hover:bg-surface-2/30 transition-colors">
                <div className="md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-3 md:items-center flex flex-wrap items-center gap-2">
                  {/* User (click to expand stats) */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : u.id)}
                    className="min-w-0 flex-1 flex items-center gap-2 text-left"
                  >
                    <ChevronDown size={14} className={`text-muted shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{u.name || "—"}</p>
                        {isSelf && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">YOU</span>}
                        {!u.verified && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-2 text-muted border border-border">unverified</span>}
                      </div>
                      <p className="text-xs text-muted truncate">{u.email}</p>
                    </div>
                  </button>

                  {/* Plan */}
                  <div className="md:w-24 md:text-center">
                    {u.pro ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-400 border border-amber-400/30">
                          <Crown size={10} /> {u.lifetime ? "Life" : "Pro"}
                        </span>
                        {!u.lifetime && u.proUntil && (
                          <p className="text-[9px] text-muted mt-0.5">until {format(new Date(u.proUntil), "MMM d, yyyy")}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-muted">Free</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="md:w-24 md:text-center">
                    {u.pendingDeletion ? (
                      <span className="text-[11px] text-red-400">Deleting</span>
                    ) : u.disabled ? (
                      <span className="text-[11px] text-orange-400">Disabled</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400"><CheckCircle2 size={10} /> Active</span>
                    )}
                  </div>

                  {/* Habits */}
                  <div className="md:w-16 md:text-center">
                    <span className="text-xs font-mono text-muted">{u.habitCount}</span>
                  </div>

                  {/* Joined + menu */}
                  <div className="md:w-24 flex items-center justify-end gap-1 md:text-right">
                    <span className="text-[11px] text-muted hidden sm:inline">{format(new Date(u.createdAt), "MMM d, yyyy")}</span>
                    <div className="relative">
                      <button
                        onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                        disabled={busy}
                        className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface-2 transition-colors disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
                      </button>
                      {menuId === u.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                          <div className="absolute right-0 top-8 z-50 w-44 bg-surface-2 border border-border rounded-xl shadow-xl py-1">
                            <MenuItem icon={<Crown size={13} />} onClick={() => { setGranting(u); setMenuId(null); }}>
                              {u.pro ? "Change premium" : "Give premium"}
                            </MenuItem>
                            {u.pro && (
                              <MenuItem icon={<Sparkles size={13} />} onClick={() => patch(u.id, { kind: "revokePro" })}>Remove premium</MenuItem>
                            )}
                            <MenuItem icon={<Pencil size={13} />} onClick={() => { setEditing(u); setMenuId(null); }}>Edit</MenuItem>
                            {u.disabled || u.pendingDeletion ? (
                              <MenuItem icon={<CheckCircle2 size={13} />} onClick={() => patch(u.id, { kind: "enable" })}>Enable</MenuItem>
                            ) : (
                              <MenuItem icon={<Ban size={13} />} disabled={isSelf} onClick={() => patch(u.id, { kind: "disable" })}>Disable</MenuItem>
                            )}
                            <div className="my-1 border-t border-border" />
                            <MenuItem icon={<Trash2 size={13} />} danger disabled={isSelf} onClick={() => { setDeleting(u); setMenuId(null); }}>Delete</MenuItem>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable per-user stats */}
                {expanded && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MiniStat icon={<Target size={13} className="text-primary" />} label="Habits" value={u.habitCount} />
                    <MiniStat icon={<CheckCheck size={13} className="text-green-400" />} label="Check-ins" value={u.checkins} />
                    <MiniStat icon={<Flame size={13} className="text-orange-400" />} label="Best streak" value={`${u.bestStreak}d`} />
                    <MiniStat
                      icon={<Clock size={13} className="text-sky-400" />}
                      label="Last active"
                      value={u.lastActive ? format(new Date(u.lastActive), "MMM d") : "—"}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">No users match “{query}”.</div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          user={editing}
          busy={busyId === editing.id}
          onCancel={() => setEditing(null)}
          onSave={(data) => patch(editing.id, { kind: "update", data })}
        />
      )}

      {/* Grant premium modal */}
      {granting && (
        <GrantModal
          user={granting}
          busy={busyId === granting.id}
          onCancel={() => setGranting(null)}
          onGrant={(data) => patch(granting.id, { kind: "grantPro", data })}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <Trash2 size={16} />
              <h3 className="text-sm font-semibold">Delete user</h3>
            </div>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              This permanently deletes <span className="text-white">{deleting.email}</span> and all their habits, logs and data. This cannot be undone.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors">Cancel</button>
              <button
                onClick={() => remove(deleting.id)}
                disabled={busyId === deleting.id}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {busyId === deleting.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-3 bg-surface border border-border rounded-xl">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[11px] text-muted">{label}</span></div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="px-3 py-2 bg-surface-2/50 border border-border rounded-lg">
      <div className="flex items-center gap-1.5 mb-0.5">{icon}<span className="text-[10px] text-muted">{label}</span></div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger, disabled }: {
  icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? "text-red-400 hover:text-red-300 hover:bg-surface" : "text-muted hover:text-white hover:bg-surface"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function GrantModal({ user, busy, onCancel, onGrant }: {
  user: AdminUserRow; busy: boolean; onCancel: () => void; onGrant: (data: { months?: number; lifetime?: boolean }) => void;
}) {
  const MONTH_OPTIONS = [1, 3, 6, 12];
  const [months, setMonths] = useState<number>(1);
  const [lifetime, setLifetime] = useState(false);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Crown size={15} className="text-amber-400" /> Give premium</h3>
          <button onClick={onCancel} className="text-muted hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted mb-4 truncate">{user.email}</p>

        {/* Duration options */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {MONTH_OPTIONS.map((m) => {
            const active = !lifetime && months === m;
            return (
              <button
                key={m}
                onClick={() => { setLifetime(false); setMonths(m); }}
                className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                  active ? "bg-primary text-white border-primary" : "bg-surface-2 text-muted border-border hover:text-white"
                }`}
              >
                {m === 12 ? "1 year" : `${m} month${m > 1 ? "s" : ""}`}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setLifetime(true)}
          className={`w-full py-2 rounded-lg text-sm font-medium border transition-all mb-4 flex items-center justify-center gap-1.5 ${
            lifetime ? "bg-amber-400 text-black border-amber-400" : "bg-surface-2 text-muted border-border hover:text-white"
          }`}
        >
          <Crown size={14} /> Lifetime
        </button>

        <div className="flex items-center gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => onGrant(lifetime ? { lifetime: true } : { months })}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-dim transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
            {lifetime ? "Grant lifetime" : months === 12 ? "Grant 1 year" : `Grant ${months} mo`}
          </button>
        </div>
        {user.pro && !user.lifetime && user.proUntil && (
          <p className="text-[11px] text-muted mt-3 text-center">Currently Pro until {format(new Date(user.proUntil), "MMM d, yyyy")} — months add to this.</p>
        )}
      </div>
    </div>
  );
}

function EditModal({ user, busy, onCancel, onSave }: {
  user: AdminUserRow; busy: boolean; onCancel: () => void; onSave: (data: { name?: string; email?: string }) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Pencil size={15} className="text-primary" /> Edit user</h3>
          <button onClick={onCancel} className="text-muted hover:text-white"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end mt-5">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-muted hover:text-white rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => onSave({ name, email })}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary-dim transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
