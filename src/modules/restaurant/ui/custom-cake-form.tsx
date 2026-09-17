"use client";

/**
 * Bakery custom cake request → Lead (formKey "custom_cake") via submitLead.
 * Extra fields use the x_ prefix and are collected into the `extra` JSON; the reference image is a private upload (Media id in `fileIds`).
 */
import * as React from "react";
import { useActionState } from "react";
import { submitLead } from "@/modules/leads/actions";
import { FileField } from "@/components/admin/uploader";
import { idle } from "@/lib/action-result";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";
import type { RestaurantCtx } from "../types";

const OCCASIONS = ["Birthday", "Wedding", "Anniversary", "Engagement", "Baby shower", "Eid", "Graduation", "Corporate", "Other"];
const FLAVOURS = ["Chocolate fudge", "Vanilla", "Red velvet", "Black forest", "Pineapple", "Coffee", "Lotus biscoff", "Strawberry", "Other"];
const WEIGHTS = ["1 lb", "2 lb", "3 lb", "4 lb", "5 lb", "6 lb", "8 lb", "10 lb", "Multi-tier"];

export function CustomCakeForm({ ctx, className }: { ctx: RestaurantCtx; className?: string }) {
  const lang = ctx.lang;
  const [state, action, pending] = useActionState(submitLead, idle);
  const [fileId, setFileId] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  // after a successful submission, clear the form (deferred so it runs as a callback, not synchronously in the effect)
  React.useEffect(() => {
    if (!state.ok) return;
    const id = window.setTimeout(() => {
      formRef.current?.reset();
      setFileId("");
    }, 0);
    return () => window.clearTimeout(id);
  }, [state.ok]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const extra: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement;
      if (input.name?.startsWith("x_")) extra[input.name.slice(2)] = input.value;
    }
    (form.elements.namedItem("extra") as HTMLInputElement).value = JSON.stringify(extra);
  }

  const err = (k: string) => (!state.ok && state.fieldErrors?.[k] ? <p className="mt-1 text-xs text-red-600">{state.fieldErrors[k]}</p> : null);
  const today = new Date();
  const minDate = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={cn("space-y-5", className)} dir={ctx.dir}>
      <input type="hidden" name="formKey" value="custom_cake" />
      <input type="hidden" name="extra" value="" />
      <input type="hidden" name="subject" value="Custom cake request" />
      <input type="hidden" name="fileIds" value={fileId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {state.message ? <div className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{state.message}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.occasion, lang)}</label>
          <select name="x_occasion" className="t-input" defaultValue="Birthday">
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.flavour, lang)}</label>
          <select name="x_flavour" className="t-input" defaultValue="Chocolate fudge">
            {FLAVOURS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.weight, lang)}</label>
          <select name="x_weight" className="t-input" defaultValue="2 lb">
            {WEIGHTS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.servings, lang)}</label>
          <input name="x_servings" type="number" min={1} max={500} className="t-input" placeholder="e.g. 12" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.dateNeeded, lang)}</label>
          <input name="x_dateNeeded" type="date" min={minDate} required className="t-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t(rs.messageOnCake, lang)}</label>
          <input name="x_messageOnCake" maxLength={80} className="t-input" placeholder="Happy Birthday Ayesha!" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t(rs.referenceImage, lang)}</label>
        <FileField value={fileId} onChange={(id) => setFileId(id)} folder="cake-refs" accept=".jpg,.jpeg,.png,.webp,.pdf" label={lang === "ur" ? "تصویر منتخب کریں" : "Choose an image"} />
      </div>

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
      <div>
        <label className="mb-1 block text-sm font-medium">{t(rs.details, lang)}</label>
        <textarea name="message" rows={4} className="t-input" placeholder={lang === "ur" ? "ڈیزائن، رنگ، تھیم، الرجی وغیرہ" : "Design, colours, theme, allergies, pickup or delivery…"} />
        {err("message")}
      </div>
      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? t(ui.loading, lang) : t(rs.customCake, lang)}
      </button>
    </form>
  );
}
