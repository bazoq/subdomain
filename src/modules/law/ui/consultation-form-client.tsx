"use client";

import * as React from "react";
import { ContactForm } from "@/modules/leads/ui/contact-form";

const CASE_TYPES: Record<"en" | "ur", string[]> = {
  en: ["Civil", "Criminal", "Family / divorce / khula", "Property / land", "Corporate / business", "Tax", "Immigration / visa", "Labour / employment", "Banking / recovery", "Other"],
  ur: ["دیوانی", "فوجداری", "خاندانی / طلاق / خلع", "جائیداد / زمین", "کارپوریٹ / کاروبار", "ٹیکس", "امیگریشن / ویزا", "لیبر / ملازمت", "بینکنگ / ریکوری", "دیگر"],
};

/** Consultation request → Lead(formKey "consultation") with extra { practiceArea, preferredDate, caseType, urgent }. */
export function ConsultationFormClient({ lang, practiceAreas, defaultPracticeArea, className, compact }: { lang: "en" | "ur"; practiceAreas: string[]; defaultPracticeArea?: string; className?: string; compact?: boolean }) {
  const ur = lang === "ur";
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ContactForm
      lang={lang}
      formKey="consultation"
      className={className}
      compact={compact}
      submitLabel={ur ? "مشاورت کی درخواست بھیجیں" : "Request consultation"}
      extraFields={
        <div className="grid gap-4 sm:grid-cols-2">
          {practiceAreas.length ? (
            <select name="x_practiceArea" className="t-input" defaultValue={defaultPracticeArea && practiceAreas.includes(defaultPracticeArea) ? defaultPracticeArea : ""} aria-label={ur ? "شعبہ" : "Practice area"}>
              <option value="">{ur ? "شعبہ منتخب کریں" : "Select practice area"}</option>
              {practiceAreas.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <input name="x_practiceArea" className="t-input" placeholder={ur ? "قانونی شعبہ" : "Legal area (e.g. property dispute)"} />
          )}
          <select name="x_caseType" className="t-input" defaultValue="" aria-label={ur ? "کیس کی قسم" : "Case type"}>
            <option value="">{ur ? "کیس کی قسم" : "Case type"}</option>
            {CASE_TYPES[lang].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="block text-sm">
            <span className="mb-1 block text-t-muted-fg">{ur ? "پسندیدہ تاریخ" : "Preferred date"}</span>
            <input type="date" name="x_preferredDate" min={today} className="t-input" />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm">
            <input type="checkbox" name="x_urgent" value={ur ? "ہاں" : "Yes"} className="size-4 accent-[var(--t-primary)]" />
            {ur ? "فوری معاملہ (اگلی سماعت / گرفتاری)" : "Urgent matter (upcoming hearing / arrest)"}
          </label>
        </div>
      }
    />
  );
}
