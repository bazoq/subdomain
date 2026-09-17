"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const L = {
  en: { title: "BMI calculator", height: "Height (cm)", weight: "Weight (kg)", calc: "Calculate", result: "Your BMI", under: "Underweight", normal: "Normal", over: "Overweight", obese: "Obese", hint: "BMI is a rough guide only. Talk to our trainers for a proper assessment.", cta: "Book a free trial" },
  ur: { title: "بی ایم آئی کیلکولیٹر", height: "قد (سینٹی میٹر)", weight: "وزن (کلوگرام)", calc: "حساب لگائیں", result: "آپ کا بی ایم آئی", under: "کم وزن", normal: "نارمل", over: "زیادہ وزن", obese: "موٹاپا", hint: "بی ایم آئی صرف ایک اندازہ ہے۔ درست جائزے کے لیے ہمارے ٹرینرز سے بات کریں۔", cta: "مفت ٹرائل بک کریں" },
};

export function bmiCategory(bmi: number): "under" | "normal" | "over" | "obese" {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "over";
  return "obese";
}

export function BmiCalculator({ lang = "en", className, ctaHref = "/join", light }: { lang?: "en" | "ur"; className?: string; ctaHref?: string; light?: boolean }) {
  const s = L[lang];
  const [height, setHeight] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [bmi, setBmi] = React.useState<number | null>(null);
  const id = React.useId();

  function calc(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(height) / 100;
    const w = Number(weight);
    if (!h || !w || h < 0.5 || h > 2.6 || w < 10 || w > 400) {
      setBmi(null);
      return;
    }
    setBmi(Math.round((w / (h * h)) * 10) / 10);
  }
  const cat = bmi != null ? bmiCategory(bmi) : null;
  const tone = cat === "normal" ? "text-emerald-500" : cat === "under" || cat === "over" ? "text-amber-500" : "text-red-500";
  const pct = bmi != null ? Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100)) : 0;

  return (
    <form onSubmit={calc} className={cn("t-card p-6 sm:p-8", light && "border-white/10 bg-white/5 text-t-dark-fg", className)} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="font-heading text-xl font-bold">
        {s.title}
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {s.height}
          <input type="number" inputMode="decimal" min={50} max={260} step="0.1" required value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="t-input mt-1.5 text-t-fg" />
        </label>
        <label className="block text-sm font-medium">
          {s.weight}
          <input type="number" inputMode="decimal" min={10} max={400} step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="t-input mt-1.5 text-t-fg" />
        </label>
      </div>
      <button type="submit" className="t-btn t-btn-primary mt-5 w-full sm:w-auto">
        {s.calc}
      </button>
      {bmi != null && cat ? (
        <div className="mt-6" aria-live="polite">
          <p className="text-sm opacity-70">{s.result}</p>
          <p className={cn("font-heading text-4xl font-extrabold", tone)}>
            {bmi} <span className="text-base font-semibold">· {s[cat]}</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-45% to-red-500">
            <div className="h-full w-1 bg-black/70 transition-all" style={{ marginInlineStart: `${pct}%` }} />
          </div>
          <p className="mt-3 text-xs opacity-70">{s.hint}</p>
          <a href={ctaHref} className="mt-4 inline-block text-sm font-semibold text-t-primary underline-offset-4 hover:underline">
            {s.cta} →
          </a>
        </div>
      ) : null}
    </form>
  );
}
