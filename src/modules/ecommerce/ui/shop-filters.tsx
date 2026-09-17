"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CategoryDTO, LangCtx } from "../types";
import { sui } from "./strings";

export type ShopSort = "featured" | "newest" | "price_asc" | "price_desc";

/**
 * Search / sort / category controls. Updates the URL (`?q=&sort=` on /shop or /shop/c/[slug]),
 * so the server page re-renders with the new query.
 */
export function ShopFilters({
  ctx,
  categories,
  current,
  basePath = "/shop",
  total,
  className,
}: {
  ctx: LangCtx;
  categories: CategoryDTO[];
  current: { q?: string; sort?: string; category?: string | null };
  basePath?: string;
  /** result count to display */
  total?: number;
  className?: string;
}) {
  const router = useRouter();
  const lang = ctx.lang;
  const [q, setQ] = React.useState(current.q ?? "");
  const sort = (current.sort as ShopSort) || "featured";

  function navigate(next: { q?: string; sort?: string; category?: string | null }) {
    const cat = next.category === undefined ? current.category : next.category;
    const params = new URLSearchParams();
    const qq = (next.q === undefined ? current.q : next.q)?.trim();
    const ss = next.sort === undefined ? sort : next.sort;
    if (qq) params.set("q", qq);
    if (ss && ss !== "featured") params.set("sort", ss);
    const path = cat ? `${basePath}/c/${cat}` : basePath;
    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }

  const hasFilters = !!(current.q || (current.sort && current.sort !== "featured") || current.category);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q });
        }}
      >
        <label htmlFor="shop-search" className="sr-only">
          {t(sui.searchPlaceholder, lang)}
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg rtl:left-auto rtl:right-3" aria-hidden="true" />
        <input
          id="shop-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(sui.searchPlaceholder, lang)}
          className="t-input pl-9 rtl:pl-3 rtl:pr-9"
          enterKeyHint="search"
        />
      </form>
      <div className="flex items-center gap-2">
        {categories.length ? (
          <>
            <label htmlFor="shop-category" className="sr-only">
              {t(sui.category, lang)}
            </label>
            <select id="shop-category" value={current.category ?? ""} onChange={(e) => navigate({ category: e.target.value || null })} className="t-input w-auto min-w-36 py-2">
              <option value="">{t(sui.allCategories, lang)}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {t(c.name, lang)}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <label htmlFor="shop-sort" className="sr-only">
          {t(sui.sortBy, lang)}
        </label>
        <select id="shop-sort" value={sort} onChange={(e) => navigate({ sort: e.target.value })} className="t-input w-auto min-w-36 py-2">
          <option value="featured">{t(sui.sortFeatured, lang)}</option>
          <option value="newest">{t(sui.sortNewest, lang)}</option>
          <option value="price_asc">{t(sui.sortPriceAsc, lang)}</option>
          <option value="price_desc">{t(sui.sortPriceDesc, lang)}</option>
        </select>
        {hasFilters ? (
          <button type="button" onClick={() => router.push(basePath)} className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-t-muted-fg hover:text-t-fg">
            <X className="size-4" /> {t(sui.clearFilters, lang)}
          </button>
        ) : null}
      </div>
      {typeof total === "number" ? (
        <p className="text-sm text-t-muted-fg sm:ml-auto">
          {total} {t(sui.results, lang)}
        </p>
      ) : null}
    </div>
  );
}
