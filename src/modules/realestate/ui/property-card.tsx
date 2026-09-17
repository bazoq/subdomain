import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Img } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { areaText, propertyPrice, purposeLabel, typeLabel } from "../helpers";

export function PropertyCard({ property: p, ctx, className }: { property: Property; ctx: SiteContext; className?: string }) {
  const lang = ctx.lang;
  const title = t(p.title as LocalizedString, lang);
  const href = `/properties/${p.slug}`;
  const area = areaText(p, lang);
  return (
    <article className={cn("t-card group relative flex flex-col overflow-hidden transition hover:shadow-lg", className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Img src={p.images[0]} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5 text-[11px] font-semibold uppercase tracking-wide rtl:left-auto rtl:right-3">
          <span className={cn("rounded-full px-2 py-0.5", p.purpose === "RENT" ? "bg-t-secondary text-t-secondary-fg" : "bg-t-primary text-t-primary-fg")}>{purposeLabel(p.purpose, lang)}</span>
          {p.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-t-accent-fg">{t(ui.featured, lang)}</span> : null}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur rtl:left-auto rtl:right-3">{typeLabel(p.type, lang)}</span>
        {p.images.length > 1 ? <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white rtl:left-3 rtl:right-auto">{p.images.length} photos</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="font-heading text-xl font-bold text-t-primary">{propertyPrice(p, lang)}</p>
        <h3 className="font-heading font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 hover:text-t-primary">
            {title}
          </Link>
        </h3>
        <p className="inline-flex items-center gap-1 text-sm text-t-muted-fg">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {p.location}, {p.city}
          </span>
        </p>
        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-t-border pt-3 text-sm text-t-muted-fg">
          {p.bedrooms != null ? (
            <li className="inline-flex items-center gap-1">
              <BedDouble className="size-4" aria-hidden="true" />
              {p.bedrooms}
              <span className="sr-only">bedrooms</span>
            </li>
          ) : null}
          {p.bathrooms != null ? (
            <li className="inline-flex items-center gap-1">
              <Bath className="size-4" aria-hidden="true" />
              {p.bathrooms}
              <span className="sr-only">bathrooms</span>
            </li>
          ) : null}
          {area ? (
            <li className="inline-flex items-center gap-1">
              <Ruler className="size-4" aria-hidden="true" />
              {area}
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  );
}
