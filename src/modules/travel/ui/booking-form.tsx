"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
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

function todayIso(): string {
  // Asia/Karachi calendar day so the min attribute matches the server-side check.
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Booking request form. When the package publishes departures the date is a select of those
 * (upcoming only); otherwise a free date picker limited to today onwards. Shows the estimated
 * total (price per person x travellers) when a price is known.
 */
export function BookingForm({
  packageId,
  ctx,
  departures = [],
  pricePerPerson = 0,
  className,
}: {
  packageId: string;
  ctx: SiteContext;
  departures?: string[];
  pricePerPerson?: number;
  className?: string;
}) {
  const lang = ctx.lang;
  const uid = React.useId();
  const [value, setValue] = React.useState<FormState>({ packageId, name: "", phone: "", email: "", travellers: 2, date: "", message: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const websiteRef = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setValue((s) => ({ ...s, [k]: v }));
  const fid = (k: string) => `${uid}-${k}`;
  const err = (k: string) =>
    errors[k] ? (
      <p id={`${fid(k)}-err`} className="mt-1 text-xs text-red-600" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${fid(k)}-err` : undefined });
  const total = pricePerPerson > 0 ? pricePerPerson * value.travellers : 0;

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
        <label htmlFor={fid("name")} className="sr-only">
          {t(ts.yourName, lang)}
        </label>
        <input id={fid("name")} required autoComplete="name" placeholder={`${t(ts.yourName, lang)} *`} value={value.name} onChange={(e) => set("name", e.target.value)} className="t-input" {...aria("name")} />
        {err("name")}
      </div>
      <div>
        <label htmlFor={fid("phone")} className="sr-only">
          {t(ts.yourPhone, lang)}
        </label>
        <input id={fid("phone")} required inputMode="tel" autoComplete="tel" placeholder={`${t(ts.yourPhone, lang)} * (03XX-XXXXXXX)`} value={value.phone} onChange={(e) => set("phone", e.target.value)} className="t-input" {...aria("phone")} />
        {err("phone")}
      </div>
      <div>
        <label htmlFor={fid("email")} className="sr-only">
          {t(ts.yourEmail, lang)}
        </label>
        <input id={fid("email")} type="email" autoComplete="email" placeholder={t(ts.yourEmail, lang)} value={value.email} onChange={(e) => set("email", e.target.value)} className="t-input" {...aria("email")} />
        {err("email")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={fid("trav")} className="mb-1 block text-xs font-medium text-t-muted-fg">
            {t(ts.travellers, lang)}
          </label>
          <input
            id={fid("trav")}
            type="number"
            min={1}
            max={200}
            inputMode="numeric"
            value={value.travellers}
            onChange={(e) => set("travellers", Math.min(200, Math.max(1, Math.round(Number(e.target.value) || 1))))}
            className="t-input"
            {...aria("travellers")}
          />
          {err("travellers")}
        </div>
        <div>
          <label htmlFor={fid("date")} className="mb-1 block text-xs font-medium text-t-muted-fg">
            {t(ts.preferredDate, lang)}
          </label>
          {departures.length ? (
            <select id={fid("date")} value={value.date} onChange={(e) => set("date", e.target.value)} className="t-input" {...aria("date")}>
              <option value="">{t(ts.flexible, lang)}</option>
              {departures.map((d) => (
                <option key={d} value={d}>
                  {new Date(`${d}T00:00:00Z`).toLocaleDateString(lang === "ur" ? "ur-PK" : "en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                </option>
              ))}
            </select>
          ) : (
            <input id={fid("date")} type="date" min={todayIso()} value={value.date} onChange={(e) => set("date", e.target.value)} className="t-input" {...aria("date")} />
          )}
          {err("date")}
        </div>
      </div>
      {total > 0 ? (
        <p className="flex items-baseline justify-between rounded-[var(--t-radius)] bg-t-muted px-3 py-2 text-sm" aria-live="polite">
          <span className="text-t-muted-fg">
            {t(ts.estimatedTotal, lang)} · {value.travellers} {t(ts.forTravellers, lang)}
          </span>
          <span className="font-heading font-bold text-t-primary">{formatPKR(total)}</span>
        </p>
      ) : null}
      <div>
        <label htmlFor={fid("msg")} className="sr-only">
          {t(ts.message, lang)}
        </label>
        <textarea id={fid("msg")} rows={3} maxLength={2000} placeholder={t(ts.message, lang)} value={value.message} onChange={(e) => set("message", e.target.value)} className="t-input" {...aria("message")} />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full disabled:opacity-60">
        {pending ? t(ui.loading, lang) : t(ts.requestBooking, lang)}
      </button>
    </form>
  );
}
