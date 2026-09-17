"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FileField } from "@/components/admin/uploader";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { submitPrescription } from "../actions";
import type { StoreCtx } from "../types";
import { sui } from "./strings";

/** Standalone prescription upload (medical stores): name, phone, notes, private file → Prescription row. */
export function PrescriptionForm({ ctx, className }: { ctx: StoreCtx; className?: string }) {
  const lang = ctx.lang;
  const [form, setForm] = React.useState({ name: "", phone: "", notes: "" });
  const [file, setFile] = React.useState<{ id: string; name: string }>({ id: "", name: "" });
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setBusy(true);
    setErrors({});
    setMessage(null);
    const res = await submitPrescription({ ...form, mediaId: file.id, website: honeypot });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setMessage(res.message ?? t(sui.uploadRxDone, lang));
    } else {
      setErrors(res.fieldErrors ?? {});
      setMessage(res.message);
    }
  }

  if (done) {
    return (
      <div className={cn("t-card mx-auto max-w-lg p-8 text-center", className)}>
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="font-heading mt-3 text-xl font-semibold">{t(sui.uploadRxDone, lang)}</h2>
        <Link href="/shop" className="t-btn t-btn-primary mt-6">
          {t(ui.continueShopping, lang)}
        </Link>
      </div>
    );
  }
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null);
  const label = "mb-1 block text-sm font-medium";
  return (
    <form onSubmit={onSubmit} className={cn("t-card mx-auto max-w-lg space-y-4 p-5 sm:p-6", className)} noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {message ? (
        <p role="alert" className="rounded-[var(--t-radius)] bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}
      <div>
        <label htmlFor="rx-name" className={label}>
          {t(ui.name, lang)} *
        </label>
        <input id="rx-name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="t-input" />
        {err("name")}
      </div>
      <div>
        <label htmlFor="rx-phone" className={label}>
          {t(ui.phone, lang)} *
        </label>
        <input id="rx-phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="t-input" />
        {err("phone")}
      </div>
      <div>
        <span className={label}>{t(sui.rxFile, lang)} *</span>
        <FileField value={file.id} onChange={(id, name) => setFile({ id, name })} folder="prescriptions" accept=".pdf,.jpg,.jpeg,.png" label={t(sui.rxFile, lang)} />
        {file.id ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="size-4" /> {file.name}
          </p>
        ) : null}
        {err("mediaId")}
      </div>
      <div>
        <label htmlFor="rx-notes" className={label}>
          {t(sui.rxNotes, lang)}
        </label>
        <textarea id="rx-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="t-input" />
        {err("notes")}
      </div>
      <button type="submit" disabled={busy || !file.id} className="t-btn t-btn-primary w-full disabled:opacity-60">
        {busy ? t(ui.loading, lang) : t(ui.uploadPrescription, lang)}
      </button>
    </form>
  );
}
