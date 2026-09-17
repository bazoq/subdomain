import Link from "next/link";
import { CalendarDays, MapPin, Moon } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Img } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { kindLabel, parseDepartures } from "../helpers";
import { ts } from "../strings";

export function PackageCard({ pkg, ctx, className }: { pkg: TravelPackage; ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  const href = `/packages/${pkg.slug}`;
  const next = parseDepartures(pkg.departures, true)[0];
  return (
    <article className={cn("t-card group relative flex flex-col overflow-hidden transition hover:shadow-lg", className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Img src={pkg.images[0]} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5 text-[11px] font-semibold uppercase tracking-wide rtl:left-auto rtl:right-3">
          <span className="rounded-full bg-t-primary px-2 py-0.5 text-t-primary-fg">{kindLabel(pkg.kind, lang)}</span>
          {pkg.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
        </div>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur rtl:left-3 rtl:right-auto">
          <Moon className="size-3" aria-hidden="true" />
          {pkg.days}D / {pkg.nights}N
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="inline-flex items-center gap-1 text-xs text-t-muted-fg">
          <MapPin className="size-3.5" aria-hidden="true" />
          {pkg.destination}
        </p>
        <h3 className="font-heading text-lg font-bold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 hover:text-t-primary">
            {title}
          </Link>
        </h3>
        {next ? (
          <p className="inline-flex items-center gap-1 text-xs text-t-muted-fg">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {new Date(next).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-t-muted-fg">{t(ts.from, lang)}</p>
            <p className="font-heading text-xl font-bold text-t-primary">{formatPKR(pkg.price)}</p>
            {pkg.priceNote ? <p className="text-[11px] text-t-muted-fg">{pkg.priceNote}</p> : null}
          </div>
          <span className="text-sm font-semibold text-t-primary group-hover:underline">{t(ts.viewPackage, lang)} →</span>
        </div>
      </div>
    </article>
  );
}
