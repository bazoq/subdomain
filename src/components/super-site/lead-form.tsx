"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { submitSuperLead } from "@/server/super/leads-actions";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface LeadFormProps {
  defaultCategory?: string;
  /** Pre-filled message, e.g. "I am interested in template #901". */
  defaultMessage?: string;
  /** Where the form was shown (home, pricing, template:901 …) — stored with the lead for the sales team. */
  source?: string;
  compact?: boolean;
  className?: string;
}

type State = { ok: true; message: string } | { ok: false; message: string; fieldErrors?: Record<string, string> } | null;

/**
 * Public "get your website" form. Every input has a real <label> (placeholders are hints only), errors
 * are announced via aria-describedby/role=alert, the honeypot is invisible to assistive tech, and the
 * form element is captured before the await (React nulls `currentTarget` after the handler returns).
 */
export function LeadForm({ defaultCategory, defaultMessage, source, compact, className }: LeadFormProps) {
  const id = React.useId();
  const [state, setState] = React.useState<State>(null);
  const [pending, setPending] = React.useState(false);
  const errorRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (source) fd.set("source", source);
    setPending(true);
    let res: Awaited<ReturnType<typeof submitSuperLead>>;
    try {
      res = await submitSuperLead(Object.fromEntries(fd.entries()));
    } catch {
      res = { ok: false, message: "Network problem. Please check your connection and try again." };
    }
    setPending(false);
    if (res.ok) {
      form.reset();
      setState({ ok: true, message: "Thank you! We will call or WhatsApp you within a few hours." });
    } else {
      setState({ ok: false, message: res.message, fieldErrors: res.fieldErrors });
      // Move focus to the first invalid field so keyboard and screen-reader users land on the problem.
      const first = Object.keys(res.fieldErrors ?? {})[0];
      const el = first ? form.querySelector<HTMLElement>(`[name="${first}"]`) : null;
      (el ?? errorRef.current)?.focus();
    }
  }

  const input = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 aria-[invalid=true]:border-red-500";
  const label = "mb-1 block text-xs font-semibold text-slate-700";
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errId = (k: string) => `${id}-${k}-error`;
  const err = (k: string) =>
    fieldErrors[k] ? (
      <p id={errId(k)} className="mt-1 text-xs text-red-600">
        {fieldErrors[k]}
      </p>
    ) : null;
  const a11y = (k: string) => ({ "aria-invalid": fieldErrors[k] ? true : undefined, "aria-describedby": fieldErrors[k] ? errId(k) : undefined });

  if (state?.ok) {
    return (
      <div className={cn("rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center", className)} role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto size-8 text-emerald-600" aria-hidden />
        <p className="mt-2 font-semibold text-emerald-900">{state.message}</p>
        <button type="button" onClick={() => setState(null)} className="mt-3 text-xs font-semibold text-emerald-800 underline">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", className)} noValidate aria-busy={pending}>
      {/* Honeypot: hidden from everyone (display:none is not exposed to assistive tech either). */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div ref={errorRef} tabIndex={-1} role="alert" aria-live="assertive" className={cn(state && !state.ok && state.message ? "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" : "sr-only")}>
        {state && !state.ok ? state.message : ""}
      </div>
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            Your name <span aria-hidden="true">*</span>
          </label>
          <input id={`${id}-name`} name="name" required autoComplete="name" placeholder="e.g. Ahmed Raza" className={input} {...a11y("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className={label}>
            Mobile number <span aria-hidden="true">*</span>
          </label>
          <input id={`${id}-phone`} name="phone" required inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" className={input} {...a11y("phone")} />
          {err("phone")}
        </div>
      </div>
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor={`${id}-business`} className={label}>
            Business name
          </label>
          <input id={`${id}-business`} name="business" autoComplete="organization" placeholder="e.g. Raza Bakers" className={input} {...a11y("business")} />
          {err("business")}
        </div>
        <div>
          <label htmlFor={`${id}-category`} className={label}>
            Business type
          </label>
          <select id={`${id}-category`} name="category" defaultValue={defaultCategory ?? ""} className={input} {...a11y("category")}>
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          {err("category")}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={label}>
          Email <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" className={input} {...a11y("email")} />
        {err("email")}
      </div>
      {!compact || defaultMessage ? (
        <div>
          <label htmlFor={`${id}-message`} className={label}>
            Message <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea id={`${id}-message`} name="message" rows={3} defaultValue={defaultMessage} placeholder="Tell us about your business or the template number you liked" className={cn(input, "h-auto py-2.5")} {...a11y("message")} />
          {err("message")}
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Sending…" : "Request my website"}
      </button>
      <p className="text-center text-xs text-slate-500">We reply within hours, 7 days a week.</p>
    </form>
  );
}
