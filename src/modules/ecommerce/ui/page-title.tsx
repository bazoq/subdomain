import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact, hero-less page heading used across shop / cart / checkout pages. */
export function PageTitle({
  title,
  subtitle,
  crumbs,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-t-border bg-t-muted/40", className)}>
      <div className="t-container flex flex-col gap-3 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
        <div>
          {crumbs?.length ? (
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-t-muted-fg">
              {crumbs.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {i > 0 ? <ChevronRight className="size-3 rtl:rotate-180" /> : null}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-t-fg">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-t-fg">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-t-muted-fg">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
