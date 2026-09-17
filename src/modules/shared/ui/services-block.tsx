import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Service } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Container, Icon, Img, SectionHeading } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { getServices } from "@/modules/shared/queries";
import { asLocalizedList } from "@/modules/shared/content-types";

type HeadingData = { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };

export function servicePriceLabel(s: Pick<Service, "priceFrom" | "priceNote">, lang: "en" | "ur"): string {
  if (s.priceFrom == null) return s.priceNote ?? "";
  const from = lang === "ur" ? `${formatPKR(s.priceFrom)} سے` : `From ${formatPKR(s.priceFrom)}`;
  return s.priceNote ? `${from} · ${s.priceNote}` : from;
}

export function ServiceCard({
  ctx,
  service,
  variant = "icon",
  light,
  className,
  showFeatures = false,
  showPrice = true,
}: {
  ctx: SiteContext;
  service: Service;
  variant?: "icon" | "image" | "list";
  light?: boolean;
  className?: string;
  showFeatures?: boolean;
  showPrice?: boolean;
}) {
  const href = `/services/${service.slug}`;
  const name = t(service.name as LocalizedString, ctx.lang);
  const summary = t(service.summary as LocalizedString, ctx.lang);
  const price = showPrice ? servicePriceLabel(service, ctx.lang) : "";
  const features = showFeatures ? asLocalizedList(service.features).slice(0, 4) : [];

  if (variant === "list") {
    return (
      <Link href={href} className={cn("group flex items-start gap-4 border-b py-5 last:border-0", light ? "border-white/10" : "border-t-border", className)}>
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-[var(--t-radius)] [&_svg]:size-5", light ? "bg-white/10 text-t-accent" : "bg-t-primary/10 text-t-primary")}>
          <Icon name={service.icon ?? undefined} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("font-heading block text-lg font-bold group-hover:text-t-primary", light && "text-t-dark-fg")}>{name}</span>
          {summary ? <span className={cn("mt-1 line-clamp-2 block text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{summary}</span> : null}
        </span>
        <span className="hidden shrink-0 items-center gap-3 sm:flex">
          {price ? <span className="text-sm font-semibold text-t-primary">{price}</span> : null}
          <ArrowRight className="size-5 text-t-muted-fg transition group-hover:translate-x-1 group-hover:text-t-primary rtl:rotate-180" />
        </span>
      </Link>
    );
  }
  if (variant === "image") {
    return (
      <article className={cn("t-card group flex h-full flex-col overflow-hidden", light && "border-white/10 bg-white/5", className)}>
        <Link href={href} className="relative block overflow-hidden">
          <Img src={service.imageUrl ?? ""} alt={name} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Icon name={service.icon ?? undefined} className="size-10 opacity-40" />} />
          {service.isFeatured ? <span className="absolute start-3 top-3 rounded-full bg-t-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-t-accent-fg">{t(ui.featured, ctx.lang)}</span> : null}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <h3 className={cn("font-heading text-lg font-bold", light ? "text-t-dark-fg" : "text-t-fg")}>
            <Link href={href} className="hover:text-t-primary">
              {name}
            </Link>
          </h3>
          {summary ? <p className={cn("mt-1.5 line-clamp-2 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{summary}</p> : null}
          {features.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-t-primary" /> {t(f, ctx.lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            {price ? <span className="text-sm font-bold text-t-primary">{price}</span> : <span />}
            <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-t-primary hover:underline">
              {t(ui.viewDetails, ctx.lang)} <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </article>
    );
  }
  return (
    <Link href={href} className={cn("t-card group flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lg", light && "border-white/10 bg-white/5", className)}>
      <span className={cn("flex size-12 items-center justify-center rounded-[var(--t-radius)] [&_svg]:size-6", light ? "bg-white/10 text-t-accent" : "bg-t-primary/10 text-t-primary")}>
        <Icon name={service.icon ?? undefined} />
      </span>
      <h3 className={cn("font-heading mt-4 text-lg font-bold group-hover:text-t-primary", light ? "text-t-dark-fg" : "text-t-fg")}>{name}</h3>
      {summary ? <p className={cn("mt-2 line-clamp-3 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{summary}</p> : null}
      {features.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-t-primary" /> {t(f, ctx.lang)}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-t-primary">
        {price || t(ui.readMore, ctx.lang)}
        <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180" />
      </span>
    </Link>
  );
}

export async function ServicesBlock({
  ctx,
  variant = "icon",
  columns = 3,
  featuredOnly,
  take = 9,
  heading,
  light,
  className,
  id = "services",
  bare,
  showFeatures,
  showPrice,
}: {
  ctx: SiteContext;
  variant?: "icon" | "image" | "list";
  columns?: 2 | 3 | 4;
  featuredOnly?: boolean;
  take?: number;
  heading?: HeadingData;
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
  showFeatures?: boolean;
  showPrice?: boolean;
}) {
  const rows = await getServices(ctx.tenant.id, { featuredOnly, take });
  if (!rows.length) return null;
  const h = heading ?? ((ctx.sections.services?.data as HeadingData | undefined) ?? { title: ui.services });
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const body =
    variant === "list" ? (
      <div className="mx-auto max-w-4xl">
        {rows.map((s) => (
          <ServiceCard key={s.id} ctx={ctx} service={s} variant="list" light={light} showPrice={showPrice} />
        ))}
      </div>
    ) : (
      <div className={cn("grid gap-6", cols)}>
        {rows.map((s) => (
          <ServiceCard key={s.id} ctx={ctx} service={s} variant={variant} light={light} showFeatures={showFeatures} showPrice={showPrice} />
        ))}
      </div>
    );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}
