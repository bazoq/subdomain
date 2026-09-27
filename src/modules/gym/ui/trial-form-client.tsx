"use client";

import * as React from "react";
import { ContactForm } from "@/modules/leads/ui/contact-form";

export type TrialPlanOption = { id: string; label: string };

const GOALS: Record<"en" | "ur", { value: string; label: string }[]> = {
  en: [
    { value: "weight_loss", label: "Weight loss" },
    { value: "muscle_gain", label: "Muscle gain / bodybuilding" },
    { value: "fitness", label: "General fitness" },
    { value: "strength", label: "Strength training" },
    { value: "cardio", label: "Cardio & endurance" },
    { value: "ladies", label: "Ladies-only sessions" },
  ],
  ur: [
    { value: "weight_loss", label: "وزن کم کرنا" },
    { value: "muscle_gain", label: "باڈی بلڈنگ" },
    { value: "fitness", label: "عمومی فٹنس" },
    { value: "strength", label: "طاقت کی ٹریننگ" },
    { value: "cardio", label: "کارڈیو" },
    { value: "ladies", label: "خواتین کے سیشن" },
  ],
};

/** Free-trial / join request → Lead(formKey "gym_trial") with extra { goal, plan, planId, preferredTime }. */
export function TrialFormClient({ lang, plans, defaultPlanId, className, compact }: { lang: "en" | "ur"; plans: TrialPlanOption[]; defaultPlanId?: string; className?: string; compact?: boolean }) {
  const ur = lang === "ur";
  const uid = React.useId();
  const [planId, setPlanId] = React.useState(defaultPlanId && plans.some((p) => p.id === defaultPlanId) ? defaultPlanId : "");
  const planLabel = plans.find((p) => p.id === planId)?.label ?? "";
  const lbl = "mb-1 block text-xs font-medium text-t-muted-fg";
  const goalId = `${uid}-goal`;
  const planSelectId = `${uid}-plan`;
  const timeId = `${uid}-time`;
  const timeLabel = ur ? "پسندیدہ وقت" : "Preferred time to visit";
  const timePlaceholder = ur ? "مثلاً شام ۶ بجے" : "e.g. weekdays 6 PM";
  return (
    <ContactForm
      lang={lang}
      formKey="gym_trial"
      className={className}
      compact={compact}
      submitLabel={ur ? "مفت ٹرائل بک کریں" : "Book my free trial"}
      extraFields={
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={goalId} className={lbl}>
              {ur ? "آپ کا مقصد" : "Your fitness goal"} *
            </label>
            <select id={goalId} name="x_goal" className="t-input" defaultValue="" required>
              <option value="" disabled>
                {ur ? "مقصد منتخب کریں" : "Select a goal"}
              </option>
              {GOALS[lang].map((g) => (
                <option key={g.value} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            {plans.length ? (
              <>
                <label htmlFor={planSelectId} className={lbl}>
                  {ur ? "پلان (اختیاری)" : "Interested plan (optional)"}
                </label>
                <select id={planSelectId} name="x_planId" className="t-input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  <option value="">{ur ? "پلان منتخب کریں" : "Choose a plan"}</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label htmlFor={timeId} className={lbl}>
                  {timeLabel}
                </label>
                <input id={timeId} name="x_preferredTime" className="t-input" maxLength={80} placeholder={timePlaceholder} />
              </>
            )}
            <input type="hidden" name="x_plan" value={planLabel} />
          </div>
          {plans.length ? (
            <div className="sm:col-span-2">
              <label htmlFor={timeId} className={lbl}>
                {timeLabel}
              </label>
              <input id={timeId} name="x_preferredTime" className="t-input" maxLength={80} placeholder={timePlaceholder} />
            </div>
          ) : null}
        </div>
      }
    />
  );
}
