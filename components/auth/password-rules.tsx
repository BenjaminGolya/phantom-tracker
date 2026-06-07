"use client";

import { Check, X } from "lucide-react";
import { checkPassword } from "@/lib/password";

// Live password-requirements checklist. Renders nothing until the user types.
export function PasswordRules({ value }: { value: string }) {
  if (!value) return null;
  const { rules } = checkPassword(value);
  return (
    <ul className="space-y-1 mt-1">
      {rules.map((r) => (
        <li key={r.label} className="flex items-center gap-1.5 text-[11px]">
          {r.met ? <Check size={11} className="text-green-400" /> : <X size={11} className="text-muted/60" />}
          <span className={r.met ? "text-green-400" : "text-muted"}>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}
