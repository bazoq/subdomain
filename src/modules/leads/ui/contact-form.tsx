"use client";

/**
 * REFERENCE public form (theme-agnostic; uses t-* classes).
 * Accessibility contract: every control has a `<label htmlFor>` (visually hidden when the design is
 * placeholder-led), field errors are `role="alert"` and linked via aria-describedby/aria-invalid,
 * the result banner is `role="alert"` on failure and `role="status"` on success.
 */
import * as React from "react";
import { useActionState } from "react";
import { submitLead } from "@/modules/leads/actions";
import { idle } from "@/lib/action-result";
import { t, ui, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ContactForm({
  lang,
  formKey = "contact",
  subjectOptions,
  className,
  extraFields,
  submitLabel,
  compact,
  showLabels = false,
}: {
  lang: Lang;
  formKey?: string;
  subjectOptions?: string[];
  className?: string;
  /** extra rendered inputs; their values are collected into `extra` JSON by name prefix "x_" */
  extraFields?: React.ReactNode;
  submitLabel?: string;
  compact?: boolean;
  /** render visible labels above inputs instead of placeholder-only (labels are always present for AT) */
  showLabels?: boolean;
}) {
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = React.useRef<HTMLFormElement>(null);
  const uid = React.useId();
  const fid = (k: string) => `${uid}-${k}`;
  const ur = lang === "ur";

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // collect x_* fields into hidden `extra` JSON (unchecked checkboxes are skipped)
    const form = e.currentTarget;
    const extra: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement;
      if (!input.name?.startsWith("x_")) continue;
      if (input.type === "checkbox" && !input.checked) continue;
      if (input.value) extra[input.name.slice(2)] = input.value;
    }
    (form.elements.namedItem("extra") as HTMLInputElement).value = JSON.stringify(extra);
  }

  const fieldError = (k: string) => (!state.ok && state.fieldErrors?.[k]) || null;
  const err = (k: string) => {
    const msg = fieldError(k);
    return msg ? (
      <p id={`${fid(k)}-err`} className="mt-1 text-xs text-red-600" role="alert">
        {msg}
      </p>
    ) : null;
  };
  const aria = (k: string) => ({ "aria-invalid": fieldError(k) ? true : undefined, "aria-describedby": fieldError(k) ? `${fid(k)}-err` : undefined });
  const labelCls = showLabels ? "mb-1 block text-xs font-medium text-t-muted-fg" : "sr-only";
  const subjectLabel = ur ? "موضوع" : "Subject";

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      <input type="hidden" name="formKey" value={formKey} />
      <input type="hidden" name="extra" value="" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}
        >
          {state.message}
        </div>
      ) : null}
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor={fid("name")} className={labelCls}>
            {t(ui.name, lang)} *
          </label>
          <input id={fid("name")} name="name" required autoComplete="name" maxLength={80} placeholder={`${t(ui.name, lang)} *`} className="t-input" {...aria("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={fid("phone")} className={labelCls}>
            {t(ui.phone, lang)} *
          </label>
          <input id={fid("phone")} name="phone" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder={`${t(ui.phone, lang)} * (03XX-XXXXXXX)`} className="t-input" {...aria("phone")} />
          {err("phone")}
        </div>
      </div>
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor={fid("email")} className={labelCls}>
            {t(ui.email, lang)}
          </label>
          <input id={fid("email")} name="email" type="email" autoComplete="email" maxLength={120} placeholder={t(ui.email, lang)} className="t-input" {...aria("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor={fid("subject")} className={labelCls}>
            {subjectLabel}
          </label>
          {subjectOptions?.length ? (
            <select id={fid("subject")} name="subject" className="t-input" defaultValue="" {...aria("subject")}>
              <option value="" disabled>
                {ur ? "موضوع منتخب کریں" : "Select a subject"}
              </option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input id={fid("subject")} name="subject" maxLength={150} placeholder={subjectLabel} className="t-input" {...aria("subject")} />
          )}
          {err("subject")}
        </div>
      </div>
      {extraFields}
      <div>
        <label htmlFor={fid("message")} className={labelCls}>
          {t(ui.message, lang)}
        </label>
        <textarea id={fid("message")} name="message" rows={4} maxLength={3000} placeholder={t(ui.message, lang)} className="t-input" {...aria("message")} />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? t(ui.loading, lang) : (submitLabel ?? t(ui.send, lang))}
      </button>
    </form>
  );
}
