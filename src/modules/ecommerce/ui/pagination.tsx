import Link from "next/link";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LangCtx } from "../types";
import { sui } from "./strings";

/** Previous / next pagination for storefront listings (theme-agnostic). */
export function ShopPagination({ page, pageCount, hrefFor, ctx, className }: { page: number; pageCount: number; hrefFor: (p: number) => string; ctx: LangCtx; className?: string }) {
  if (pageCount <= 1) return null;
  const btn = "t-btn t-btn-outline px-4 py-2 text-sm";
  return (
    <nav aria-label="Pagination" className={cn("mt-10 flex items-center justify-between gap-4", className)}>
      <span className="text-sm text-t-muted-fg">
        {t(sui.page, ctx.lang)} {page} {t(sui.of, ctx.lang)} {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={btn} rel="prev">
            {t(sui.previous, ctx.lang)}
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={btn} rel="next">
            {t(sui.next, ctx.lang)}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
