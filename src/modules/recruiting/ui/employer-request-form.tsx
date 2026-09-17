"use client";

import * as React from "react";
import { useActionState } from "react";
import type { SiteContext } from "@/templates/types";
import { submitLead } from "@/modules/leads/actions";
import { idle } from "@/lib/action-result";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";

/** Employers asking the agency to source staff → Lead(formKey "employer_request") with company/positions in `data`. */
export function EmployerRequestForm({ ctx, className }: { ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const extra: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement;
      if (input.name?.startsWith("x_")) extra[input.name.slice(2)] = input.value;
    }
    (form.elements.namedItem("extra") as HTMLInputElement).value = JSON.stringify(extra);
    (form.elements.namedItem("subject") as HTMLInputElement).value = `Employer request: ${extra.company || ""}`.trim();
  }

  const err = (k: string) => (!state.ok && state.fieldErrors?.[k] ? <p className="mt-1 text-xs text-red-600">{state.fieldErrors[k]}</p> : null);
  const field = (id: string, label: string, input: React.ReactNode, key?: string) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {input}
      {key ? err(key) : null}
    </div>
  );

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={cn("space-y-4", className)}>
      <input type="hidden" name="formKey" value="employer_request" />
      <input type="hidden" name="extra" value="" />
      <input type="hidden" name="subject" value="" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message ? (
        <div className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")} role="status">
          {state.message}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("er-company", `${t(rs.companyName, lang)} *`, <input id="er-company" name="x_company" required maxLength={120} className="t-input" />)}
        {field("er-name", `${t(rs.contactPerson, lang)} *`, <input id="er-name" name="name" required autoComplete="name" className="t-input" />, "name")}
        {field("er-phone", `${t(rs.yourPhone, lang)} *`, <input id="er-phone" name="phone" required inputMode="tel" placeholder="03XX-XXXXXXX" className="t-input" />, "phone")}
        {field("er-email", t(rs.yourEmail, lang), <input id="er-email" name="email" type="email" className="t-input" />, "email")}
        {field("er-positions", `${t(rs.positionsNeeded, lang)} *`, <input id="er-positions" name="x_positions" required maxLength={200} className="t-input" />)}
        {field("er-count", t(rs.headcount, lang), <input id="er-count" name="x_count" type="number" min={1} max={10000} defaultValue={1} className="t-input" />)}
        {field("er-location", t(rs.workLocation, lang), <input id="er-location" name="x_location" maxLength={120} placeholder="Riyadh, Saudi Arabia" className="t-input" />)}
      </div>
      {field("er-message", t(rs.employerMessage, lang), <textarea id="er-message" name="message" rows={4} maxLength={3000} className="t-input" />, "message")}
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full disabled:opacity-60 sm:w-auto">
        {pending ? t(ui.loading, lang) : t(rs.sendRequest, lang)}
      </button>
    </form>
  );
}
