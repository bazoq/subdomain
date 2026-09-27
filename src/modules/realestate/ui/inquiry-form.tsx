"use client";

import * as React from "react";
import { useActionState } from "react";
import type { SiteContext } from "@/templates/types";
import { submitLead } from "@/modules/leads/actions";
import { idle } from "@/lib/action-result";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";

/** Property inquiry → Lead(formKey "property_inquiry") with { propertyId, propertyTitle, slug } in `data`. */
export function InquiryForm({
  ctx,
  property,
  className,
  compact,
}: {
  ctx: SiteContext;
  property: { id: string; title: string; slug: string };
  className?: string;
  compact?: boolean;
}) {
  const lang = ctx.lang;
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = React.useRef<HTMLFormElement>(null);
  const extra = React.useMemo(() => JSON.stringify({ propertyId: property.id, propertyTitle: property.title, slug: property.slug }), [property]);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const uid = React.useId();
  const fid = (k: string) => `${uid}-${k}`;
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

  return (
    <form ref={formRef} action={action} className={cn("space-y-3", className)} noValidate>
      <input type="hidden" name="formKey" value="property_inquiry" />
      <input type="hidden" name="extra" value={extra} />
      <input type="hidden" name="subject" value={`Inquiry: ${property.title}`} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message ? (
        <div className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")} role={state.ok ? "status" : "alert"}>
          {state.message}
        </div>
      ) : null}
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor={fid("name")} className="sr-only">
            {t(rs.yourName, lang)}
          </label>
          <input id={fid("name")} name="name" required autoComplete="name" maxLength={80} placeholder={`${t(rs.yourName, lang)} *`} className="t-input" {...aria("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={fid("phone")} className="sr-only">
            {t(rs.yourPhone, lang)}
          </label>
          <input id={fid("phone")} name="phone" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder={`${t(rs.yourPhone, lang)} *`} className="t-input" {...aria("phone")} />
          {err("phone")}
        </div>
      </div>
      <div>
        <label htmlFor={fid("email")} className="sr-only">
          {t(rs.yourEmail, lang)}
        </label>
        <input id={fid("email")} name="email" type="email" autoComplete="email" maxLength={120} placeholder={t(rs.yourEmail, lang)} className="t-input" {...aria("email")} />
        {err("email")}
      </div>
      <div>
        <label htmlFor={fid("msg")} className="sr-only">
          {t(rs.message, lang)}
        </label>
        <textarea id={fid("msg")} name="message" rows={3} maxLength={3000} defaultValue={t(rs.inquiryPlaceholder, lang)} className="t-input" {...aria("message")} />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full disabled:opacity-60">
        {pending ? t(ui.loading, lang) : t(rs.sendInquiry, lang)}
      </button>
    </form>
  );
}
