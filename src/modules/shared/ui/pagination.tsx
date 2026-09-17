import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Public-site pagination (theme-agnostic). Renders nothing for a single page. */
export function PublicPagination({
  page,
  pageCount,
  hrefFor,
  lang = "en",
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (p: number) => string;
  lang?: Lang;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pageCount, page + 2); p++) pages.push(p);
  const btn = "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--t-radius)] border border-t-border px-3 text-sm font-medium transition hover:bg-t-muted";
  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btn} aria-label={lang === "ur" ? "پچھلا" : "Previous"}>
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Link>
      ) : null}
      {pages[0] > 1 ? (
        <>
          <Link href={hrefFor(1)} className={btn}>
            1
          </Link>
          {pages[0] > 2 ? <span className="px-1 text-t-muted-fg">…</span> : null}
        </>
      ) : null}
      {pages.map((p) => (
        <Link key={p} href={hrefFor(p)} aria-current={p === page ? "page" : undefined} className={cn(btn, p === page && "border-t-primary bg-t-primary text-t-primary-fg hover:bg-t-primary")}>
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < pageCount ? (
        <>
          {pages[pages.length - 1] < pageCount - 1 ? <span className="px-1 text-t-muted-fg">…</span> : null}
          <Link href={hrefFor(pageCount)} className={btn}>
            {pageCount}
          </Link>
        </>
      ) : null}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={btn} aria-label={lang === "ur" ? "اگلا" : "Next"}>
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      ) : null}
    </nav>
  );
}
