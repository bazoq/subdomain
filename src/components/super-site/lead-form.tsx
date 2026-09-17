"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { submitSuperLead } from "@/server/super/leads-actions";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function LeadForm({ defaultCategory, compact, className }: { defaultCategory?: string; compact?: boolean; className?: string }) {
  const [state, setState] = React.useState<{ ok: boolean; message: string; fieldErrors?: Record<string, string> } | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = Object.fromEntries(fd.entries());
    setPending(true);
    const res = await submitSuperLead(input);
    setPending(false);
    if (res.ok) {
      setState({ ok: true, message: "Thank you! We will call or WhatsApp you within a few hours." });
      e.currentTarget.reset();
    } else setState({ ok: false, message: res.message, fieldErrors: res.fieldErrors });
  }

  const input = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
  const err = (k: string) => state && !state.ok && state.fieldErrors?.[k] ? <p className="mt-1 text-xs text-red-600">{state.fieldErrors[k]}</p> : null;

  if (state?.ok) {
    return (
      <div className={cn("rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center", className)}>
        <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-900">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", className)}>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state && !state.ok && state.message ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div> : null}
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div>
          <input name="name" required placeholder="Your name" className={input} />
          {err("name")}
        </div>
        <div>
          <input name="phone" required inputMode="tel" placeholder="Mobile (03XX-XXXXXXX)" className={input} />
          {err("phone")}
        </div>
      </div>
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div>
          <input name="business" placeholder="Business name" className={input} />
        </div>
        <div>
          <select name="category" defaultValue={defaultCategory ?? ""} className={input}>
            <option value="">Business type</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <input name="email" type="email" placeholder="Email (optional)" className={input} />
      {!compact ? <textarea name="message" rows={3} placeholder="Tell us about your business or the template you liked" className={cn(input, "h-auto py-2.5")} /> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request my website"}
      </button>
      <p className="text-center text-xs text-slate-500">We reply within hours, 7 days a week.</p>
    </form>
  );
}
