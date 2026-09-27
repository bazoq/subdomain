"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return <input className={cn(base, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return <textarea className={cn(base, "min-h-[96px] resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }) {
  return (
    <select className={cn(base, "h-10 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Help({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="mt-1 text-xs text-slate-500">
      {children}
    </p>
  );
}

export function FieldError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-600" aria-live="polite">
      {children}
    </p>
  );
}

// PasswordInput is a hoisted function declaration (defined below), so referencing it here is safe.
const CONTROL_TYPES: unknown[] = [Input, Textarea, Select, PasswordInput, "input", "select", "textarea"];

/**
 * Label + control + help/error wrapper. When the child is a single Input/Select/Textarea it
 * is wired automatically: `id` (so the label targets it), `aria-describedby` (help/error text)
 * and `aria-invalid`. Wrapped controls (e.g. colour picker + text) should pass `htmlFor`.
 */
export function Field({
  label,
  help,
  error,
  htmlFor,
  children,
  className,
  required,
  hideLabel,
}: {
  label: string;
  help?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  /** visually hide the label (still read by screen readers) */
  hideLabel?: boolean;
}) {
  const autoId = React.useId();
  const only = React.Children.count(children) === 1 ? (React.Children.toArray(children)[0] as React.ReactNode) : null;
  const isControl = React.isValidElement(only) && CONTROL_TYPES.includes(only.type);
  const controlProps = isControl ? (only.props as { id?: string }) : undefined;
  const id = htmlFor ?? controlProps?.id ?? autoId;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, !error && help ? helpId : null].filter(Boolean).join(" ") || undefined;

  const control =
    isControl && React.isValidElement(only)
      ? React.cloneElement(only as React.ReactElement<Record<string, unknown>>, {
          id,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
          "aria-required": required || undefined,
        })
      : children;

  return (
    <div className={className}>
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
        {required ? (
          <span className="text-red-500" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {control}
      {error ? <FieldError id={errorId}>{error}</FieldError> : help ? <Help id={helpId}>{help}</Help> : null}
    </div>
  );
}

/** Accessible toggle (role=switch). Works controlled (`checked` + `onChange`) and inside native forms (`name`). */
export function Switch({
  checked,
  onChange,
  name,
  label,
  disabled,
  description,
  id: idProp,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  name?: string;
  label?: string;
  disabled?: boolean;
  description?: string;
  id?: string;
}) {
  const autoId = React.useId();
  const id = idProp ?? autoId;
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          name={name}
          value="on"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label || description ? (
        <span className="flex flex-col">
          {label ? <span className="text-sm text-slate-700">{label}</span> : null}
          {description ? <span className="text-xs text-slate-500">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

export function Checkbox({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" className={cn("h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500", className)} {...props} />
      {label}
    </label>
  );
}

/* ---------- password strength ---------- */

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hint?: string };
export type PasswordContext = { username?: string | null };

/** Mirrors `PASSWORD_MIN` / `PASSWORD_MAX` in src/server/auth/password.ts. */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;
/** Same denylist as the server (well-known passwords that satisfy "letters + digits"). */
const COMMON = new Set([
  "password1", "password12", "password123", "password1234", "passw0rd", "passw0rd1", "qwerty123", "qwerty1234", "qwertyuiop1", "1q2w3e4r5t",
  "1qaz2wsx3edc", "abc123456", "abcd1234", "abcdef123", "admin123", "admin1234", "administrator1", "welcome1", "welcome123", "letmein123",
  "iloveyou1", "pakistan123", "karachi123", "lahore123", "siteforge1", "changeme1", "temp1234", "test1234", "user1234",
]);

/**
 * Client-side mirror of the server `passwordPolicy`: returns the same message the server would,
 * or null when acceptable. The server stays the authority; this only gives instant feedback.
 */
export function passwordPolicyMessage(pw: string, ctx: PasswordContext = {}): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Password must contain letters and numbers.";
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common. Choose something less guessable.";
  if (/^(.)\1+$/.test(lower)) return "Password must not repeat a single character.";
  const u = ctx.username?.trim().toLowerCase();
  if (u && u.length >= 4 && lower.includes(u)) return "Password must not contain your username.";
  return null;
}

/** Strength estimate for the meter: policy failures score 1, then length/variety add points. */
export function passwordStrength(pw: string, ctx: PasswordContext = {}): Strength {
  if (!pw) return { score: 0, label: "" };
  const hasUpperLower = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length < PASSWORD_MIN) {
    const left = PASSWORD_MIN - pw.length;
    return { score: 1, label: "Too short", hint: `${left} more character${left === 1 ? "" : "s"} needed` };
  }
  const policy = passwordPolicyMessage(pw, ctx);
  if (policy) return { score: 1, label: "Weak", hint: policy.replace(/^Password must /, "Must ").replace(/\.$/, "") };
  let score = 2;
  if (pw.length >= 14) score++;
  if (hasUpperLower || hasSymbol) score++;
  if (pw.length >= 16 && hasUpperLower && hasSymbol) score = 4;
  const s = Math.min(4, score) as Strength["score"];
  return { score: s, label: s >= 4 ? "Very strong" : s === 3 ? "Strong" : "OK", hint: s === 2 ? "Longer or mixed-case passwords are stronger" : undefined };
}

export function PasswordStrength({ value, className, username, id }: { value: string; className?: string; username?: string | null; id?: string }) {
  const s = passwordStrength(value, { username });
  if (!value) return null;
  const colors = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return (
    <div id={id} className={cn("mt-2", className)} aria-live="polite">
      <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={s.score} aria-valuetext={s.label} aria-label="Password strength">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= s.score ? colors[s.score] : "bg-slate-200")} />
        ))}
      </div>
      <p className={cn("mt-1 text-xs", s.score <= 1 ? "text-red-600" : s.score === 2 ? "text-amber-700" : "text-emerald-700")}>
        {s.label}
        {s.hint ? <span className="text-slate-500"> · {s.hint}</span> : null}
      </p>
    </div>
  );
}

/** Text input that reveals/hides its value; use for password fields. */
export function PasswordInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pr-16", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-pressed={show}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
