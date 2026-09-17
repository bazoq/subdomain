import Link from "next/link";
import { SearchX } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { JobListResult } from "../queries";
import { jobsHref } from "../helpers";
import { rs } from "../strings";
import { JobCard } from "./job-card";

/**
 * Server component: renders a page of jobs plus pagination links.
 * `params` are the current filter values so pagination links keep them.
 */
export function JobList({
  result,
  ctx,
  params = {},
  className,
  columns = 2,
}: {
  result: JobListResult;
  ctx: SiteContext;
  params?: Record<string, string | undefined>;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  const lang = ctx.lang;
  if (result.items.length === 0) {
    return (
      <div className={cn("t-card flex flex-col items-center px-6 py-16 text-center", className)}>
        <SearchX className="size-10 text-t-muted-fg" aria-hidden="true" />
        <p className="mt-3 font-heading text-lg font-semibold">{t(rs.noJobs, lang)}</p>
        <p className="mt-1 text-sm text-t-muted-fg">{t(rs.noJobsHint, lang)}</p>
        <Link href="/jobs" className="t-btn t-btn-outline mt-5 text-sm">
          {t(rs.clearFilters, lang)}
        </Link>
      </div>
    );
  }
  return (
    <div className={className}>
      <p className="mb-4 text-sm text-t-muted-fg" aria-live="polite">
        <span className="font-semibold text-t-fg">{result.total}</span> {t(rs.resultsFound, lang)}
      </p>
      <div className={cn("grid gap-4", columns === 2 && "md:grid-cols-2", columns === 3 && "md:grid-cols-2 xl:grid-cols-3")}>
        {result.items.map((job) => (
          <JobCard key={job.id} job={job} ctx={ctx} />
        ))}
      </div>
      <JobsPagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => jobsHref({ ...params, page: p })} />
    </div>
  );
}

export function JobsPagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
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
