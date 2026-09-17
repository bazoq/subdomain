"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { PROPERTY_TYPES, RENT_PRICE_STEPS, SALE_PRICE_STEPS, type Purpose } from "../constants";
import { typeLabel } from "../helpers";
import { rs } from "../strings";

export interface PropertySearchValues {
  purpose?: string;
  type?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  q?: string;
  sort?: string;
}

/**
 * Search bar for heroes and the listing page: Buy/Rent toggle, type, city, price range, beds, keyword → GET /properties.
 * Price steps switch between sale (Lac/Crore) and rent (monthly) scales when the purpose toggles.
 */
export function PropertySearch({
  ctx,
  cities = [],
  current = {},
  className,
  variant = "card",
  showKeyword = true,
}: {
  ctx: SiteContext;
  cities?: { value: string; count?: number }[] | string[];
  current?: PropertySearchValues;
  className?: string;
  variant?: "card" | "plain";
  showKeyword?: boolean;
}) {
  const lang = ctx.lang;
  const [purpose, setPurpose] = React.useState<Purpose>(current.purpose === "RENT" ? "RENT" : "SALE");
  const steps = purpose === "RENT" ? RENT_PRICE_STEPS : SALE_PRICE_STEPS;
  const cityList = cities.map((c) => (typeof c === "string" ? { value: c, count: undefined } : c));
  const cityKnown = current.city && !cityList.some((c) => c.value === current.city) ? [{ value: current.city, count: undefined }, ...cityList] : cityList;
  const sel = "t-input h-11 py-0";

  return (
    <form method="get" action="/properties" role="search" aria-label={t(rs.search, lang)} className={cn("w-full", variant === "card" && "t-card p-3 shadow-lg sm:p-4", className)}>
      {current.sort ? <input type="hidden" name="sort" value={current.sort} /> : null}
      <div className="mb-3 inline-flex rounded-[var(--t-radius)] bg-t-muted p-1" role="radiogroup" aria-label={t(rs.purpose, lang)}>
        {(["SALE", "RENT"] as const).map((p) => (
          <label key={p} className={cn("cursor-pointer rounded-[calc(var(--t-radius)-2px)] px-4 py-1.5 text-sm font-semibold transition", purpose === p ? "bg-t-primary text-t-primary-fg shadow" : "text-t-muted-fg hover:text-t-fg")}>
            <input type="radio" name="purpose" value={p} checked={purpose === p} onChange={() => setPurpose(p)} className="sr-only" />
            {p === "SALE" ? t(rs.buy, lang) : t(rs.rent, lang)}
          </label>
        ))}
      </div>
      <div className={cn("grid gap-2 sm:grid-cols-2", showKeyword ? "lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.8fr_auto]" : "lg:grid-cols-[1fr_1fr_1fr_1fr_0.8fr_auto]")}>
        {showKeyword ? (
          <label className="sm:col-span-2 lg:col-span-1">
            <span className="sr-only">{t(rs.keyword, lang)}</span>
            <input name="q" defaultValue={current.q ?? ""} placeholder={t(rs.keyword, lang)} className={sel} />
          </label>
        ) : null}
        <label>
          <span className="sr-only">{t(rs.propertyType, lang)}</span>
          <select name="type" defaultValue={current.type ?? ""} className={sel}>
            <option value="">{t(rs.anyType, lang)}</option>
            {PROPERTY_TYPES.map((x) => (
              <option key={x} value={x}>
                {typeLabel(x, lang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t(rs.city, lang)}</span>
          <select name="city" defaultValue={current.city ?? ""} className={sel}>
            <option value="">{t(rs.anyCity, lang)}</option>
            {cityKnown.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value}
                {c.count ? ` (${c.count})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t(rs.minPrice, lang)}</span>
          <select name="minPrice" key={`min-${purpose}`} defaultValue={current.minPrice ?? ""} className={sel}>
            <option value="">{t(rs.minPrice, lang)}</option>
            {steps.map((v) => (
              <option key={v} value={v}>
                {formatPKR(v, { compact: true })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t(rs.maxPrice, lang)}</span>
          <select name="maxPrice" key={`max-${purpose}`} defaultValue={current.maxPrice ?? ""} className={sel}>
            <option value="">{t(rs.maxPrice, lang)}</option>
            {steps.map((v) => (
              <option key={v} value={v}>
                {formatPKR(v, { compact: true })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t(rs.beds, lang)}</span>
          <select name="bedrooms" defaultValue={current.bedrooms ?? ""} className={sel}>
            <option value="">{t(rs.anyBeds, lang)}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+ {t(rs.beds, lang)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="t-btn t-btn-primary h-11 py-0">
          <Search className="size-4" aria-hidden="true" />
          {t(rs.search, lang)}
        </button>
      </div>
    </form>
  );
}
