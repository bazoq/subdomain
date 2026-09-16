"use client";

/** REFERENCE public form (theme-agnostic; uses t-* classes). */
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
}: {
  lang: Lang;
  formKey?: string;
  subjectOptions?: string[];
  className?: string;
  /** extra rendered inputs; their values are collected into `extra` JSON by name prefix "x_" */
  extraFields?: React.ReactNode;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // collect x_* fields into hidden `extra` JSON
    const form = e.currentTarget;
    const extra: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement;
      if (input.name?.startsWith("x_")) extra[input.name.slice(2)] = input.value;
    }
    (form.elements.namedItem("extra") as HTMLInputElement).value = JSON.stringify(extra);
  }

  const err = (k: string) => (!state.ok && state.fieldErrors?.[k] ? <p className="mt-1 text-xs text-red-600">{state.fieldErrors[k]}</p> : null);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <input type="hidden" name="formKey" value={formKey} />
      <input type="hidden" name="extra" value="" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message ? (
        <div
          className={cn(
            "rounded-[var(--t-radius)] px-4 py-3 text-sm",
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
          )}
        >
          {state.message}
        </div>
      ) : null}
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <input name="name" required placeholder={t(ui.name, lang)} className="t-input" />
          {err("name")}
        </div>
        <div>
          <input name="phone" required inputMode="tel" placeholder={`${t(ui.phone, lang)} (03XX-XXXXXXX)`} className="t-input" />
          {err("phone")}
        </div>
      </div>
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <input name="email" type="email" placeholder={t(ui.email, lang)} className="t-input" />
          {err("email")}
        </div>
        <div>
          {subjectOptions?.length ? (
            <select name="subject" className="t-input" defaultValue="">
              <option value="" disabled>
                {lang === "ur" ? "موضوع منتخب کریں" : "Select a subject"}
              </option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input name="subject" placeholder={lang === "ur" ? "موضوع" : "Subject"} className="t-input" />
          )}
        </div>
      </div>
      {extraFields}
      <div>
        <textarea name="message" rows={4} placeholder={t(ui.message, lang)} className="t-input" />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? t(ui.loading, lang) : (submitLabel ?? t(ui.send, lang))}
      </button>
    </form>
  );
}
