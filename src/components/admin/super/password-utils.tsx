"use client";

import * as React from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Minimum password length shown in client-side help text. Mirrors `PASSWORD_MIN` in
 * `src/server/auth/password.ts` (server-only, so it cannot be imported here) — keep the two in sync.
 */
export const PASSWORD_MIN = 10;

/** Browser-side password generator (mirrors the server policy: 12 chars, letters + digits, no ambiguous glyphs). */
export function generateClientPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, length - 2)}a7`;
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {done ? <Check /> : <Copy />}
      {done ? "Copied" : "Copy"}
    </Button>
  );
}

/** Password input with show/hide + generate. */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input id={id} type={show ? "text" : "password"} value={value} autoComplete={autoComplete} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="pr-9 font-mono" />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={show ? "Hide" : "Show"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          onChange(generateClientPassword());
          setShow(true);
        }}
      >
        <RefreshCw />
        Generate
      </Button>
    </div>
  );
}

/** One-time credential reveal box (shown after create / reset). */
export function CredentialReveal({ title, lines, note, className }: { title: string; lines: { label: string; value: string }[]; note?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-amber-300 bg-amber-50 p-4", className)}>
      <p className="text-sm font-semibold text-amber-900">{title}</p>
      <p className="mt-0.5 text-xs text-amber-800">{note ?? "Shown once only. Copy it now and share it with the owner through a private channel."}</p>
      <dl className="mt-3 space-y-2">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-amber-200">
            <dt className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{l.label}</dt>
            <dd className="flex-1 truncate font-mono text-sm text-slate-900">{l.value}</dd>
            <CopyButton text={l.value} />
          </div>
        ))}
      </dl>
    </div>
  );
}
