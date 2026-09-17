import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { t, ui, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, lang, light, className }: { items: Crumb[]; lang: Lang; light?: boolean; className?: string }) {
  const all: Crumb[] = [{ label: t(ui.home, lang), href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3.5 opacity-60 rtl:rotate-180" aria-hidden="true" /> : null}
              {c.href && !last ? (
                <Link href={c.href} className={cn("transition hover:underline", light ? "hover:text-t-dark-fg" : "hover:text-t-fg")}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("font-medium", light ? "text-t-dark-fg" : "text-t-fg")}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
