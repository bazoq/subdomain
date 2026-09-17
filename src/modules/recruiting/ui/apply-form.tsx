"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { FileField } from "@/components/admin/uploader";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { applyToJob } from "../actions";
import { CV_ACCEPT, CV_FOLDER, EXPERIENCE_LEVELS } from "../constants";
import type { ApplyInput } from "../schema";
import { rs } from "../strings";

type FormState = Required<Omit<ApplyInput, "website">>;

export function ApplyForm({ jobId, ctx, className }: { jobId: string; ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const [value, setValue] = React.useState<FormState>({ jobId, name: "", phone: "", email: "", city: "", experience: "", coverLetter: "", cvMediaId: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const websiteRef = React.useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setValue((s) => ({ ...s, [k]: v }));
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.cvMediaId) {
      setErrors({ cvMediaId: t(rs.cvRequired, lang) });
      return;
    }
    setPending(true);
    setErrors({});
    setMessage(null);
    const res = await applyToJob({ ...value, website: websiteRef.current?.value ?? "" });
    setPending(false);
    if (res.ok) {
      setDone(true);
      setMessage(res.message ?? t(rs.applied, lang));
    } else {
      setErrors(res.fieldErrors ?? {});
      setMessage(res.message || t(ui.somethingWrong, lang));
    }
  }

  if (done) {
    return (
      <div className={cn("rounded-[var(--t-radius)] bg-emerald-50 p-6 text-center text-emerald-900", className)} role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <p className="mt-3 font-heading text-lg font-semibold">{message}</p>
        <Link href="/jobs" className="t-btn t-btn-outline mt-5 text-sm">
          {t(rs.applyAnother, lang)}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      <input ref={websiteRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {message ? (
        <div className="rounded-[var(--t-radius)] bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ap-name" className="mb-1 block text-sm font-medium">
            {t(rs.yourName, lang)} *
          </label>
          <input id="ap-name" required autoComplete="name" value={value.name} onChange={(e) => set("name", e.target.value)} className="t-input" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="ap-phone" className="mb-1 block text-sm font-medium">
            {t(rs.yourPhone, lang)} *
          </label>
          <input id="ap-phone" required inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" value={value.phone} onChange={(e) => set("phone", e.target.value)} className="t-input" />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="ap-email" className="mb-1 block text-sm font-medium">
            {t(rs.yourEmail, lang)}
          </label>
          <input id="ap-email" type="email" autoComplete="email" value={value.email} onChange={(e) => set("email", e.target.value)} className="t-input" />
          {err("email")}
        </div>
        <div>
          <label htmlFor="ap-city" className="mb-1 block text-sm font-medium">
            {t(rs.yourCity, lang)}
          </label>
          <input id="ap-city" autoComplete="address-level2" placeholder="Lahore, Karachi, Islamabad…" value={value.city} onChange={(e) => set("city", e.target.value)} className="t-input" />
          {err("city")}
        </div>
        <div>
          <label htmlFor="ap-exp" className="mb-1 block text-sm font-medium">
            {t(rs.experience, lang)}
          </label>
          <select id="ap-exp" value={value.experience} onChange={(e) => set("experience", e.target.value)} className="t-input">
            <option value="">{t(rs.selectExperience, lang)}</option>
            {EXPERIENCE_LEVELS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          {err("experience")}
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">{t(rs.uploadCv, lang)} *</span>
          <FileField value={value.cvMediaId} onChange={(id) => set("cvMediaId", id)} folder={CV_FOLDER} accept={CV_ACCEPT} label={t(rs.uploadCv, lang)} />
          {err("cvMediaId")}
        </div>
      </div>
      <div>
        <label htmlFor="ap-cover" className="mb-1 block text-sm font-medium">
          {t(rs.coverLetter, lang)}
        </label>
        <textarea id="ap-cover" rows={4} maxLength={3000} value={value.coverLetter} onChange={(e) => set("coverLetter", e.target.value)} className="t-input" />
        {err("coverLetter")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full disabled:opacity-60 sm:w-auto">
        {pending ? t(ui.loading, lang) : t(rs.submitApplication, lang)}
      </button>
    </form>
  );
}
