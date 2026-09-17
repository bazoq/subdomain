"use client";

import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PACKAGE_KINDS } from "../constants";
import { kindLabel, packagesHref } from "../helpers";
import { ts } from "../strings";

/**
 * Kind tabs (All / Tours / Umrah / Hajj …) that drive the `kind` URL param on /packages.
 * Pass `counts` from getPackages().kinds to hide empty kinds and show counts.
 */
export function PackageTabs({
  ctx,
  current,
  counts,
  params = {},
  className,
  showEmpty = false,
}: {
  ctx: SiteContext;
  current?: string;
  counts?: { value: string; count: number }[];
  /** other active filters to keep (destination, q) */
  params?: Record<string, string | undefined>;
  className?: string;
  showEmpty?: boolean;
}) {
  const lang = ctx.lang;
  const countOf = (k: string) => counts?.find((c) => c.value === k)?.count ?? 0;
  const kinds = PACKAGE_KINDS.filter((k) => showEmpty || !counts || countOf(k) > 0);
  const total = counts?.reduce((n, c) => n + c.count, 0);
  const tabs = [{ value: "", label: t(ts.allKinds, lang), count: total }, ...kinds.map((k) => ({ value: k, label: kindLabel(k, lang), count: counts ? countOf(k) : undefined }))];
  return (
    <nav className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0", className)} aria-label={t(ts.packageType, lang)}>
      {tabs.map((tab) => {
        const active = (current ?? "") === tab.value;
        return (
          <Link
            key={tab.value}
            href={packagesHref({ ...params, kind: tab.value, page: undefined })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
              active ? "border-t-primary bg-t-primary text-t-primary-fg" : "border-t-border bg-t-card hover:border-t-primary hover:text-t-primary",
            )}
          >
            {tab.label}
            {tab.count != null ? <span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-t-primary-fg/20" : "bg-t-muted text-t-muted-fg")}>{tab.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
