"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { JobFacets } from "../queries";
import { rs } from "../strings";

export interface JobFilterValues {
  q?: string;
  location?: string;
  type?: string;
  country?: string;
  department?: string;
}

/**
 * Filter bar for /jobs. A plain GET form (works without JS); selects auto-submit when JS is on.
 * Current values come from the server page's searchParams.
 */
export function JobFilters({ ctx, facets, current, className }: { ctx: SiteContext; facets: JobFacets; current: JobFilterValues; className?: string }) {
  const lang = ctx.lang;
  const formRef = React.useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const hasFilters = Boolean(current.q || current.location || current.type || current.country || current.department);

  return (
    <form ref={formRef} method="get" action="/jobs" className={cn("t-card p-4 sm:p-5", className)} role="search" aria-label={t(rs.findJobs, lang)}>
      {current.department ? <input type="hidden" name="department" value={current.department} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,minmax(0,160px))_auto]">
        <label className="relative block">
          <span className="sr-only">{t(rs.keyword, lang)}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg rtl:left-auto rtl:right-3" aria-hidden="true" />
          <input name="q" defaultValue={current.q ?? ""} placeholder={t(rs.keyword, lang)} className="t-input pl-9 rtl:pl-3 rtl:pr-9" />
        </label>
        <FacetSelect name="location" label={t(rs.location, lang)} any={t(rs.anyLocation, lang)} value={current.location} options={facets.locations} onChange={submit} />
        <FacetSelect name="type" label={t(rs.jobType, lang)} any={t(rs.anyType, lang)} value={current.type} options={facets.types} onChange={submit} />
        <FacetSelect name="country" label={t(rs.country, lang)} any={t(rs.anyCountry, lang)} value={current.country} options={facets.countries} onChange={submit} />
        <button type="submit" className="t-btn t-btn-primary whitespace-nowrap">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t(rs.findJobs, lang)}
        </button>
      </div>
      {hasFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {current.department ? <Chip>{current.department}</Chip> : null}
          {current.q ? <Chip>“{current.q}”</Chip> : null}
          <Link href="/jobs" className="font-medium text-t-primary underline-offset-2 hover:underline">
            {t(rs.clearFilters, lang)}
          </Link>
        </div>
      ) : null}
    </form>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-t-muted px-2.5 py-1 text-t-muted-fg">{children}</span>;
}

function FacetSelect({
  name,
  label,
  any,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  any: string;
  value?: string;
  options: { value: string; count: number }[];
  onChange: () => void;
}) {
  // keep the current value selectable even if it is not in the facet list (e.g. a stale link)
  const opts = value && !options.some((o) => o.value === value) ? [{ value, count: 0 }, ...options] : options;
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value ?? ""} onChange={onChange} className="t-input">
        <option value="">{any}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value}
            {o.count ? ` (${o.count})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
