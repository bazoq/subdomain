"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createBooking } from "../actions";
import { ts } from "../strings";

interface FormState {
  packageId: string;
  name: string;
  phone: string;
  email: string;
  travellers: number;
  date: string;
  message: string;
}

export function BookingForm({ packageId, ctx, departures = [], className }: { packageId: string; ctx: SiteContext; departures?: string[]; className?: string }) {
  const lang = ctx.lang;
  const [value, setValue] = React.useState<FormState>({ packageId, name: "", phone: "", email: "", travellers: 2, date: "", message: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const websiteRef = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setValue((s) => ({ ...s, [k]: v }));
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setMessage(null);
    const res = await createBooking({ ...value, website: websiteRef.current?.value ?? "" });
    setPending(false);
    if (res.ok) {
      setDone(true);
      setMessage(res.message ?? t(ts.booked, lang));
    } else {
      setErrors(res.fieldErrors ?? {});
      setMessage(res.message || t(ui.somethingWrong, lang));
    }
  }

  if (done) {
    return (
      <div className={cn("rounded-[var(--t-radius)] bg-emerald-50 p-6 text-center text-emerald-900", className)} role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <p className="mt-3 font-semibold">{message}</p>
        <Link href="/packages" className="t-btn t-btn-outline mt-5 text-sm">
          {t(ts.bookAnother, lang)}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", className)} noValidate>
      <input ref={websiteRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {message ? (
        <div className="rounded-[var(--t-radius)] bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {message}
        </div>
      ) : null}
      <div>
        <label htmlFor="bk-name" className="sr-only">
          {t(ts.yourName, lang)}
        </label>
        <input id="bk-name" required autoComplete="name" placeholder={`${t(ts.yourName, lang)} *`} value={value.name} onChange={(e) => set("name", e.target.value)} className="t-input" />
        {err("name")}
      </div>
      <div>
        <label htmlFor="bk-phone" className="sr-only">
          {t(ts.yourPhone, lang)}
        </label>
        <input id="bk-phone" required inputMode="tel" autoComplete="tel" placeholder={`${t(ts.yourPhone, lang)} * (03XX-XXXXXXX)`} value={value.phone} onChange={(e) => set("phone", e.target.value)} className="t-input" />
        {err("phone")}
      </div>
      <div>
        <label htmlFor="bk-email" className="sr-only">
          {t(ts.yourEmail, lang)}
        </label>
        <input id="bk-email" type="email" autoComplete="email" placeholder={t(ts.yourEmail, lang)} value={value.email} onChange={(e) => set("email", e.target.value)} className="t-input" />
        {err("email")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bk-trav" className="mb-1 block text-xs font-medium text-t-muted-fg">
            {t(ts.travellers, lang)}
          </label>
          <input id="bk-trav" type="number" min={1} max={200} value={value.travellers} onChange={(e) => set("travellers", Math.max(1, Math.round(Number(e.target.value) || 1)))} className="t-input" />
          {err("travellers")}
        </div>
        <div>
          <label htmlFor="bk-date" className="mb-1 block text-xs font-medium text-t-muted-fg">
            {t(ts.preferredDate, lang)}
          </label>
          {departures.length ? (
            <select id="bk-date" value={value.date} onChange={(e) => set("date", e.target.value)} className="t-input">
              <option value="">{lang === "ur" ? "کوئی بھی" : "Flexible"}</option>
              {departures.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
          ) : (
            <input id="bk-date" type="date" value={value.date} onChange={(e) => set("date", e.target.value)} className="t-input" />
          )}
          {err("date")}
        </div>
      </div>
      <div>
        <label htmlFor="bk-msg" className="sr-only">
          {t(ts.message, lang)}
        </label>
        <textarea id="bk-msg" rows={3} maxLength={2000} placeholder={t(ts.message, lang)} value={value.message} onChange={(e) => set("message", e.target.value)} className="t-input" />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full disabled:opacity-60">
        {pending ? t(ui.loading, lang) : t(ts.requestBooking, lang)}
      </button>
    </form>
  );
}
