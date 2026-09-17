"use client";

import * as React from "react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createReservation } from "../actions";
import { rs } from "../strings";
import type { RestaurantCtx } from "../types";

export function ReservationForm({ ctx, className }: { ctx: RestaurantCtx; className?: string }) {
  const lang = ctx.lang;
  const [pending, setPending] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const formRef = React.useRef<HTMLFormElement>(null);
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setMsg(null);
    setErrors({});
    const res = await createReservation({
      name: fd.get("name"),
      phone: fd.get("phone"),
      guests: fd.get("guests"),
      date: fd.get("date"),
      time: fd.get("time"),
      notes: fd.get("notes"),
      website: fd.get("website"),
    });
    setPending(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.message ?? t(ui.thankYou, lang) });
      formRef.current?.reset();
    } else {
      setMsg({ ok: false, text: res.message });
      setErrors(res.fieldErrors ?? {});
    }
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null);

  return (
    <form ref={formRef} onSubmit={submit} className={cn("space-y-4", className)} dir={ctx.dir}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {msg ? <div className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{msg.text}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">{t(ui.name, lang)}</label>
          <input name="name" required className="t-input" autoComplete="name" />
          {err("name")}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(ui.phone, lang)}</label>
          <input name="phone" required inputMode="tel" className="t-input" placeholder="03XX-XXXXXXX" autoComplete="tel" />
          {err("phone")}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.guests, lang)}</label>
          <input name="guests" type="number" min={1} max={50} defaultValue={2} required className="t-input" />
          {err("guests")}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.date, lang)}</label>
          <input name="date" type="date" min={minDate} required className="t-input" />
          {err("date")}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.time, lang)}</label>
          <input name="time" type="time" required className="t-input" defaultValue="19:00" />
          {err("time")}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t(ui.notes, lang)}</label>
        <textarea name="notes" rows={3} className="t-input" placeholder={lang === "ur" ? "مثلاً: سالگرہ، کھڑکی کے پاس ٹیبل" : "e.g. birthday, window seat, high chair"} />
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? t(ui.loading, lang) : t(rs.reserveTable, lang)}
      </button>
    </form>
  );
}
