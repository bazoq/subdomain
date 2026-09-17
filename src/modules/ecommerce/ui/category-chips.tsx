import Link from "next/link";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CategoryDTO, LangCtx } from "../types";

/** Horizontal, scrollable category chips ("All" + each category). */
export function CategoryChips({
  categories,
  active,
  ctx,
  basePath = "/shop",
  showCounts = true,
  className,
}: {
  categories: CategoryDTO[];
  /** active category slug */
  active?: string | null;
  ctx: LangCtx;
  basePath?: string;
  showCounts?: boolean;
  className?: string;
}) {
  if (!categories.length) return null;
  const chip = (isActive: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition",
      isActive ? "border-t-primary bg-t-primary text-t-primary-fg" : "border-t-border bg-t-card text-t-fg hover:border-t-primary hover:text-t-primary",
    );
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0", className)} role="navigation" aria-label="Categories">
      <Link href={basePath} className={chip(!active)}>
        {t(ui.all, ctx.lang)}
      </Link>
      {categories.map((c) => (
        <Link key={c.id} href={`${basePath}/c/${c.slug}`} className={chip(active === c.slug)} aria-current={active === c.slug ? "page" : undefined}>
          {t(c.name, ctx.lang)}
          {showCounts && c.productCount > 0 ? <span className={cn("text-xs", active === c.slug ? "opacity-80" : "text-t-muted-fg")}>{c.productCount}</span> : null}
        </Link>
      ))}
    </div>
  );
}
