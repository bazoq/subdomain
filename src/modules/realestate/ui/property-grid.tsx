import Link from "next/link";
import { SearchX } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PropertyListResult } from "../queries";
import { propertiesHref } from "../helpers";
import { rs } from "../strings";
import { PropertyCard } from "./property-card";

/** Server component: results count + sort links + grid + pagination. `params` keep filters in links. */
export function PropertyGrid({
  result,
  ctx,
  params = {},
  className,
  columns = 3,
  showSort = true,
}: {
  result: PropertyListResult;
  ctx: SiteContext;
  params?: Record<string, string | undefined>;
  className?: string;
  columns?: 2 | 3 | 4;
  showSort?: boolean;
}) {
  const lang = ctx.lang;
  if (result.items.length === 0) {
    return (
      <div className={cn("t-card flex flex-col items-center px-6 py-16 text-center", className)}>
        <SearchX className="size-10 text-t-muted-fg" aria-hidden="true" />
        <p className="mt-3 font-heading text-lg font-semibold">{t(rs.noResults, lang)}</p>
        <p className="mt-1 text-sm text-t-muted-fg">{t(rs.noResultsHint, lang)}</p>
        <Link href="/properties" className="t-btn t-btn-outline mt-5 text-sm">
          {t(rs.clearFilters, lang)}
        </Link>
      </div>
    );
  }
  const sorts = [
    { key: "newest", label: t(rs.newest, lang) },
    { key: "price_asc", label: t(rs.priceLow, lang) },
    { key: "price_desc", label: t(rs.priceHigh, lang) },
  ];
  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-t-muted-fg" aria-live="polite">
          <span className="font-semibold text-t-fg">{result.total}</span> {t(rs.found, lang)}
        </p>
        {showSort ? (
          <nav className="flex flex-wrap items-center gap-1" aria-label={t(rs.sortBy, lang)}>
            <span className="mr-1 text-t-muted-fg">{t(rs.sortBy, lang)}:</span>
            {sorts.map((s) => (
              <Link
                key={s.key}
                href={propertiesHref({ ...params, sort: s.key === "newest" ? undefined : s.key, page: undefined })}
                aria-current={result.sort === s.key ? "true" : undefined}
                className={cn("rounded-full px-3 py-1 transition", result.sort === s.key ? "bg-t-primary text-t-primary-fg" : "hover:bg-t-muted")}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className={cn("grid gap-5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
        {result.items.map((p) => (
          <PropertyCard key={p.id} property={p} ctx={ctx} />
        ))}
      </div>
      <PropertiesPagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => propertiesHref({ ...params, page: p })} />
    </div>
  );
}

export function PropertiesPagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const cls = "inline-flex min-w-9 items-center justify-center rounded-[var(--t-radius)] border border-t-border px-3 py-2 text-sm font-medium hover:bg-t-muted";
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cls} rel="prev">
          ‹
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && pages[i - 1] !== p - 1 ? <span className="px-1 text-t-muted-fg">…</span> : null}
          {p === page ? (
            <span className={cn(cls, "border-t-primary bg-t-primary text-t-primary-fg")} aria-current="page">
              {p}
            </span>
          ) : (
            <Link href={hrefFor(p)} className={cls}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cls} rel="next">
          ›
        </Link>
      ) : null}
    </nav>
  );
}
