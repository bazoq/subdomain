"use client";

import * as React from "react";
import { useActionState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { submitLead } from "@/modules/leads/actions";
import { idle } from "@/lib/action-result";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FileField } from "@/components/admin/uploader";

export type QuoteServiceOption = { id: string; label: string };

const OPTS = {
  en: {
    service: "Product / service",
    other: "Other (describe below)",
    qty: "Quantity",
    size: "Size",
    sizes: ["A4", "A5", "A3", "Standard business card (3.5 x 2 in)", "Custom size"],
    paper: "Paper / material",
    papers: ["Art card 300gsm", "Art paper 130gsm", "Matte 250gsm", "Bond paper 80gsm", "Vinyl / flex", "Sticker (matte)", "Sticker (glossy)", "Other"],
    sides: "Printing sides",
    sidesOpts: ["Single side", "Double side"],
    finishing: "Finishing",
    finishings: ["None", "Matte lamination", "Glossy lamination", "Spot UV", "Die cut", "Foil", "Binding / stapling"],
    deadline: "Needed by",
    notes: "Details (colours, text, special instructions)",
    files: "Design files (PDF, AI, PSD, JPG, PNG · max 25 MB each · up to 3)",
    addFile: "Attach design file",
    submit: "Request quote",
    urgent: "Rush job (24–48 hours)",
  },
  ur: {
    service: "پروڈکٹ / سروس",
    other: "دیگر (نیچے لکھیں)",
    qty: "تعداد",
    size: "سائز",
    sizes: ["A4", "A5", "A3", "بزنس کارڈ (3.5 x 2 انچ)", "کسٹم سائز"],
    paper: "کاغذ / میٹیریل",
    papers: ["آرٹ کارڈ 300gsm", "آرٹ پیپر 130gsm", "میٹ 250gsm", "بانڈ پیپر 80gsm", "وینائل / فلیکس", "اسٹیکر (میٹ)", "اسٹیکر (گلوسی)", "دیگر"],
    sides: "پرنٹنگ سائیڈ",
    sidesOpts: ["ایک طرف", "دونوں طرف"],
    finishing: "فنشنگ",
    finishings: ["کوئی نہیں", "میٹ لیمینیشن", "گلوسی لیمینیشن", "اسپاٹ یو وی", "ڈائی کٹ", "فوائل", "بائنڈنگ / اسٹیپلنگ"],
    deadline: "کب تک چاہیے",
    notes: "تفصیلات (رنگ، متن، خاص ہدایات)",
    files: "ڈیزائن فائلیں (PDF, AI, PSD, JPG, PNG · زیادہ سے زیادہ 3)",
    addFile: "ڈیزائن فائل منسلک کریں",
    submit: "قیمت معلوم کریں",
    urgent: "فوری کام (24–48 گھنٹے)",
  },
};

type Attached = { id: string; name: string };

/** Print quote request → Lead(formKey "quote") with product/spec fields in `data` and private files in `fileIds`. */
export function QuoteFormClient({ lang, services, defaultServiceId, className }: { lang: "en" | "ur"; services: QuoteServiceOption[]; defaultServiceId?: string; className?: string }) {
  const s = OPTS[lang];
  const uid = React.useId();
  const fid = (k: string) => `${uid}-${k}`;
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [files, setFiles] = React.useState<Attached[]>([]);
  const [serviceId, setServiceId] = React.useState(defaultServiceId && services.some((x) => x.id === defaultServiceId) ? defaultServiceId : "");
  const serviceLabel = services.find((x) => x.id === serviceId)?.label ?? "";
  const today = new Date().toISOString().slice(0, 10);

  // clear attached files once a submission succeeds (state adjustment during render)
  const [seenState, setSeenState] = React.useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok) setFiles([]);
  }
  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const extra: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement;
      if (input.name?.startsWith("x_")) {
        if (input.type === "checkbox" && !input.checked) continue;
        if (input.value) extra[input.name.slice(2)] = input.value;
      }
    }
    if (serviceLabel) extra.service = serviceLabel;
    extra.files = files.map((f) => f.name).join(", ");
    (form.elements.namedItem("extra") as HTMLInputElement).value = JSON.stringify(extra);
    (form.elements.namedItem("subject") as HTMLInputElement).value = serviceLabel ? `Quote: ${serviceLabel}` : "Quote request";
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
  const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-t-muted-fg";

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={cn("space-y-5", className)} noValidate>
      <input type="hidden" name="formKey" value="quote" />
      <input type="hidden" name="extra" value="" />
      <input type="hidden" name="subject" value="" />
      <input type="hidden" name="fileIds" value={files.map((f) => f.id).join(",")} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message ? (
        <div role={state.ok ? "status" : "alert"} className={cn("rounded-[var(--t-radius)] px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
          {state.message}
        </div>
      ) : null}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="font-heading mb-3 text-lg font-bold">{lang === "ur" ? "کیا پرنٹ کروانا ہے؟" : "What do you need printed?"}</legend>
        <div className="sm:col-span-2">
          <label htmlFor={fid("service")} className={lbl}>
            {s.service} *
          </label>
          {services.length ? (
            <select id={fid("service")} name="x_serviceId" className="t-input" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              <option value="" disabled>
                {s.service}
              </option>
              {services.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
              <option value="other">{s.other}</option>
            </select>
          ) : (
            <input id={fid("service")} name="x_service" className="t-input" required maxLength={120} placeholder={lang === "ur" ? "مثلاً بزنس کارڈ، فلائر، بینر" : "e.g. Business cards, flyers, banner, packaging"} />
          )}
        </div>
        <div>
          <label htmlFor={fid("qty")} className={lbl}>
            {s.qty} *
          </label>
          <input id={fid("qty")} name="x_quantity" type="number" min={1} max={10_000_000} inputMode="numeric" required className="t-input" placeholder="500" />
        </div>
        <div>
          <label htmlFor={fid("size")} className={lbl}>
            {s.size}
          </label>
          <input id={fid("size")} name="x_size" className="t-input" list={fid("sizes")} maxLength={80} placeholder={s.sizes[0]} />
          <datalist id={fid("sizes")}>
            {s.sizes.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor={fid("material")} className={lbl}>
            {s.paper}
          </label>
          <select id={fid("material")} name="x_material" className="t-input" defaultValue="">
            <option value="">—</option>
            {s.papers.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={fid("sides")} className={lbl}>
            {s.sides}
          </label>
          <select id={fid("sides")} name="x_sides" className="t-input" defaultValue={s.sidesOpts[0]}>
            {s.sidesOpts.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={fid("finishing")} className={lbl}>
            {s.finishing}
          </label>
          <select id={fid("finishing")} name="x_finishing" className="t-input" defaultValue="">
            <option value="">—</option>
            {s.finishings.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={fid("deadline")} className={lbl}>
            {s.deadline}
          </label>
          <input id={fid("deadline")} name="x_deadline" type="date" min={today} className="t-input" />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="x_rush" value="Yes" className="size-4 accent-[var(--t-primary)]" /> {s.urgent}
        </label>
        <div className="sm:col-span-2">
          <label htmlFor={fid("message")} className={lbl}>
            {s.notes}
          </label>
          <textarea id={fid("message")} name="message" rows={4} maxLength={3000} className="t-input" {...aria("message")} />
          {err("message")}
        </div>
        <div className="sm:col-span-2">
          <p id={fid("files-label")} className={lbl}>
            {s.files}
          </p>
          <ul className="mb-2 space-y-1.5" aria-labelledby={fid("files-label")}>
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-[var(--t-radius)] bg-t-muted px-3 py-2 text-sm">
                <FileText className="size-4 text-t-primary" />
                <span className="flex-1 truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.name}`} className="rounded p-0.5 hover:bg-black/10">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {files.length < 3 ? (
            <FileField
              key={files.length}
              value=""
              folder="print-files"
              accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.zip,.doc,.docx"
              label={s.addFile}
              onChange={(id, name) => setFiles((x) => (x.some((y) => y.id === id) ? x : [...x, { id, name }]))}
            />
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-xs text-t-muted-fg">
            <Paperclip className="size-3" /> {files.length}/3
          </p>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="font-heading mb-3 text-lg font-bold">{lang === "ur" ? "آپ کی معلومات" : "Your details"}</legend>
        <div>
          <label htmlFor={fid("name")} className="sr-only">
            {t(ui.name, lang)}
          </label>
          <input id={fid("name")} name="name" required autoComplete="name" maxLength={80} placeholder={`${t(ui.name, lang)} *`} className="t-input" {...aria("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={fid("phone")} className="sr-only">
            {t(ui.phone, lang)}
          </label>
          <input id={fid("phone")} name="phone" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder={`${t(ui.phone, lang)} * (03XX-XXXXXXX)`} className="t-input" {...aria("phone")} />
          {err("phone")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={fid("email")} className="sr-only">
            {t(ui.email, lang)}
          </label>
          <input id={fid("email")} name="email" type="email" autoComplete="email" maxLength={120} placeholder={t(ui.email, lang)} className="t-input" {...aria("email")} />
          {err("email")}
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="t-btn t-btn-primary w-full sm:w-auto disabled:opacity-60">
        {pending ? t(ui.loading, lang) : s.submit}
      </button>
    </form>
  );
}
