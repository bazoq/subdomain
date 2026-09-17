"use client";

import * as React from "react";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { cn, formatPKR } from "@/lib/utils";
import type { PriceTier } from "@/modules/shared/content-types";

export type EstimatorService = { id: string; label: string; tiers: PriceTier[]; priceFrom: number | null; priceNote: string | null };

/**
 * Price estimate from `Service.features` tiers `[{ qty, price }]` (price = total for that qty).
 * Between tiers we interpolate linearly; beyond the last tier we extrapolate with the last unit price.
 */
export function estimate(tiers: PriceTier[], qty: number): { total: number; exact: boolean } | null {
  if (!tiers.length || qty <= 0) return null;
  const hit = tiers.find((t) => t.qty === qty);
  if (hit) return { total: hit.price, exact: true };
  const first = tiers[0];
  if (qty < first.qty) return { total: Math.round((first.price / first.qty) * qty), exact: false };
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i];
    const b = tiers[i + 1];
    if (qty > a.qty && qty < b.qty) {
      const ratio = (qty - a.qty) / (b.qty - a.qty);
      return { total: Math.round(a.price + (b.price - a.price) * ratio), exact: false };
    }
  }
  const last = tiers[tiers.length - 1];
  return { total: Math.round((last.price / last.qty) * qty), exact: false };
}

export function PriceEstimatorClient({ lang, services, className, light, quoteHref = "/quote" }: { lang: "en" | "ur"; services: EstimatorService[]; className?: string; light?: boolean; quoteHref?: string }) {
  const ur = lang === "ur";
  const usable = services.filter((s) => s.tiers.length || s.priceFrom != null);
  const [sid, setSid] = React.useState(usable[0]?.id ?? "");
  const [qty, setQty] = React.useState(usable[0]?.tiers[0]?.qty ?? 100);
  const svc = usable.find((s) => s.id === sid);
  const est = svc ? estimate(svc.tiers, qty) : null;
  const id = React.useId();

  if (!usable.length) return null;

  return (
    <div className={cn("t-card p-6 sm:p-8", light && "border-white/10 bg-white/5 text-t-dark-fg", className)}>
      <h3 className="font-heading flex items-center gap-2 text-xl font-bold">
        <Calculator className="size-5 text-t-primary" /> {ur ? "فوری قیمت کا اندازہ" : "Instant price estimate"}
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-s`} className="block text-sm font-medium">
          {ur ? "پروڈکٹ" : "Product"}
          <select
            id={`${id}-s`}
            className="t-input mt-1.5 text-t-fg"
            value={sid}
            onChange={(e) => {
              setSid(e.target.value);
              const next = usable.find((s) => s.id === e.target.value);
              if (next?.tiers[0]) setQty(next.tiers[0].qty);
            }}
          >
            {usable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-q`} className="block text-sm font-medium">
          {ur ? "تعداد" : "Quantity"}
          <input id={`${id}-q`} type="number" min={1} inputMode="numeric" className="t-input mt-1.5 text-t-fg" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} list={`${id}-tiers`} />
          {svc?.tiers.length ? (
            <datalist id={`${id}-tiers`}>
              {svc.tiers.map((t) => (
                <option key={t.qty} value={t.qty} />
              ))}
            </datalist>
          ) : null}
        </label>
      </div>
      {svc?.tiers.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {svc.tiers.map((t) => (
            <button key={t.qty} type="button" onClick={() => setQty(t.qty)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition", qty === t.qty ? "border-t-primary bg-t-primary text-t-primary-fg" : light ? "border-white/20 hover:bg-white/10" : "border-t-border hover:bg-t-muted")}>
              {t.qty.toLocaleString("en-PK")}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-6 rounded-[var(--t-radius)] bg-t-primary/10 p-5" aria-live="polite">
        {est ? (
          <>
            <p className="text-sm opacity-70">{est.exact ? (ur ? "قیمت" : "Price") : ur ? "تخمینی قیمت" : "Estimated price"}</p>
            <p className="font-heading text-3xl font-extrabold text-t-primary">{formatPKR(est.total)}</p>
            <p className="mt-1 text-xs opacity-70">
              ≈ {formatPKR(Math.round((est.total / qty) * 100) / 100)} {ur ? "فی پیس" : "per piece"} · {qty.toLocaleString("en-PK")} {ur ? "پیس" : "pcs"}
            </p>
          </>
        ) : svc?.priceFrom != null ? (
          <>
            <p className="text-sm opacity-70">{ur ? "قیمت شروع" : "Starting from"}</p>
            <p className="font-heading text-3xl font-extrabold text-t-primary">{formatPKR(svc.priceFrom)}</p>
            {svc.priceNote ? <p className="mt-1 text-xs opacity-70">{svc.priceNote}</p> : null}
          </>
        ) : (
          <p className="text-sm">{ur ? "اس پروڈکٹ کی قیمت کے لیے ہم سے رابطہ کریں۔" : "Contact us for pricing on this product."}</p>
        )}
        <p className="mt-3 text-xs opacity-70">{ur ? "حتمی قیمت کاغذ، فنشنگ اور ڈیزائن پر منحصر ہے۔" : "Final price depends on paper, finishing and artwork. GST may apply."}</p>
      </div>
      <Link href={`${quoteHref}?service=${encodeURIComponent(sid)}&qty=${qty}`} className="t-btn t-btn-primary mt-5 w-full sm:w-auto">
        {ur ? "درست قیمت حاصل کریں" : "Get an exact quote"}
      </Link>
    </div>
  );
}
