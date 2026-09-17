import * as React from "react";
import type { SectionDefinition, SiteContext } from "@/templates/types";
import { aboutSection, brandsSection, ctaSection, featuresSection, processSection, promoSection, statsSection } from "@/templates/shared/sections";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AboutData, BrandsData, CtaData, FeaturesData, ProcessData, PromoData, StatsData } from "@/modules/shared/ui/section-types";

/**
 * Section data for `def` typed as `T`, or null when the section is disabled/missing.
 * When `override` is given the block always renders (defaults merged with the override).
 */
export function sectionData<T extends object>(ctx: SiteContext, def: SectionDefinition, override?: Partial<T>): T | null {
  const s = ctx.sections[def.key];
  if (!s || !s.enabled) return override ? ({ ...(def.defaults as object), ...override } as T) : null;
  return { ...(s.data as T), ...(override ?? {}) };
}

type Common = { ctx: SiteContext; className?: string; light?: boolean; id?: string; bare?: boolean };

/* ---------------- Stats ---------------- */
export function StatsBlock({ ctx, variant = "row", className, light, id = "stats", bare, data }: Common & { variant?: "row" | "cards"; data?: Partial<StatsData> }) {
  const d = sectionData<StatsData>(ctx, statsSection, data);
  if (!d || !d.items.length) return null;
  const body = (
    <dl className={cn("grid gap-6", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3", variant === "row" && "divide-x rtl:divide-x-reverse", variant === "row" && (light ? "divide-white/10" : "divide-t-border"))}>
      {d.items.map((it, i) => (
        <div key={i} className={cn("text-center", variant === "cards" && cn("t-card p-6", light && "border-white/10 bg-white/5"))}>
          <dd className={cn("font-heading text-3xl font-extrabold tracking-tight sm:text-4xl", light ? "text-t-accent" : "text-t-primary")}>{it.value}</dd>
          <dt className={cn("mt-1 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(it.label, ctx.lang)}</dt>
        </div>
      ))}
    </dl>
  );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-12 sm:py-16", light ? "bg-t-dark text-t-dark-fg" : "bg-t-muted", className)}>
      <Container>{body}</Container>
    </section>
  );
}

/* ---------------- Features ---------------- */
export function FeaturesBlock({
  ctx,
  variant = "grid",
  columns = 4,
  className,
  light,
  id = "features",
  bare,
  data,
}: Common & { variant?: "grid" | "list" | "alternating"; columns?: 2 | 3 | 4; data?: Partial<FeaturesData> }) {
  const d = sectionData<FeaturesData>(ctx, featuresSection, data);
  if (!d || !d.items.length) return null;
  const iconCls = cn("flex size-12 shrink-0 items-center justify-center rounded-[var(--t-radius)] [&_svg]:size-6", light ? "bg-white/10 text-t-accent" : "bg-t-primary/10 text-t-primary");
  let body: React.ReactNode;
  if (variant === "list") {
    body = (
      <ul className="mx-auto max-w-3xl space-y-6">
        {d.items.map((it, i) => (
          <li key={i} className="flex gap-4">
            <span className={iconCls}>
              <Icon name={it.icon} />
            </span>
            <div>
              <h3 className="font-heading text-lg font-bold">{t(it.title, ctx.lang)}</h3>
              <p className={cn("mt-1 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(it.text, ctx.lang)}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (variant === "alternating") {
    body = (
      <ol className="space-y-6">
        {d.items.map((it, i) => (
          <li key={i} className={cn("t-card flex flex-col gap-5 p-6 sm:items-center", i % 2 ? "sm:flex-row-reverse" : "sm:flex-row", light && "border-white/10 bg-white/5")}>
            <span className={cn(iconCls, "size-16 [&_svg]:size-8")}>
              <Icon name={it.icon} />
            </span>
            <div className={cn("flex-1", i % 2 ? "sm:text-end" : "")}>
              <h3 className="font-heading text-xl font-bold">{t(it.title, ctx.lang)}</h3>
              <p className={cn("mt-1", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(it.text, ctx.lang)}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  } else {
    const cols = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
    body = (
      <ul className={cn("grid gap-6", cols)}>
        {d.items.map((it, i) => (
          <li key={i} className={cn("t-card p-6", light && "border-white/10 bg-white/5")}>
            <span className={iconCls}>
              <Icon name={it.icon} />
            </span>
            <h3 className="font-heading mt-4 text-lg font-bold">{t(it.title, ctx.lang)}</h3>
            <p className={cn("mt-2 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(it.text, ctx.lang)}</p>
          </li>
        ))}
      </ul>
    );
  }
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}

/* ---------------- Process / how it works ---------------- */
export function ProcessBlock({ ctx, variant = "steps", className, light, id = "process", bare, data }: Common & { variant?: "steps" | "timeline"; data?: Partial<ProcessData> }) {
  const d = sectionData<ProcessData>(ctx, processSection, data);
  if (!d || !d.steps.length) return null;
  const body =
    variant === "timeline" ? (
      <ol className="relative mx-auto max-w-2xl space-y-8 border-s-2 border-t-primary/30 ps-8">
        {d.steps.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -start-[2.65rem] top-0 flex size-9 items-center justify-center rounded-full bg-t-primary text-sm font-bold text-t-primary-fg ring-4 ring-t-bg">{i + 1}</span>
            <h3 className="font-heading flex items-center gap-2 text-lg font-bold">
              <Icon name={s.icon} className="size-5 text-t-primary" /> {t(s.title, ctx.lang)}
            </h3>
            <p className={cn("mt-1 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(s.text, ctx.lang)}</p>
          </li>
        ))}
      </ol>
    ) : (
      <ol className={cn("grid gap-8", d.steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
        {d.steps.map((s, i) => (
          <li key={i} className="relative text-center">
            <span className={cn("mx-auto flex size-16 items-center justify-center rounded-full [&_svg]:size-7", light ? "bg-white/10 text-t-accent" : "bg-t-primary/10 text-t-primary")}>
              <Icon name={s.icon} />
            </span>
            <span className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-t-primary">{ctx.lang === "ur" ? `مرحلہ ${i + 1}` : `Step ${i + 1}`}</span>
            <h3 className="font-heading mt-1 text-lg font-bold">{t(s.title, ctx.lang)}</h3>
            <p className={cn("mt-2 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{t(s.text, ctx.lang)}</p>
          </li>
        ))}
      </ol>
    );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} light={light} />
        {body}
      </Container>
    </section>
  );
}

/* ---------------- CTA ---------------- */
export function CtaBlock({ ctx, variant = "banner", className, id = "cta", bare, data }: Omit<Common, "light"> & { variant?: "banner" | "card" | "split"; data?: Partial<CtaData> }) {
  const d = sectionData<CtaData>(ctx, ctaSection, data);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  const text = t(d.text, ctx.lang);
  if (!title && !text) return null;
  const bg = d.image ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
    </>
  ) : null;
  const btn = <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent" />;
  let body: React.ReactNode;
  if (variant === "card") {
    body = (
      <div className={cn("relative overflow-hidden rounded-[var(--t-radius)] p-8 text-center sm:p-12", d.image ? "text-white" : "bg-t-primary text-t-primary-fg")}>
        {bg}
        <div className="relative">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
          {text ? <p className="mx-auto mt-3 max-w-xl opacity-85">{text}</p> : null}
          <div className="mt-6">{btn}</div>
        </div>
      </div>
    );
  } else if (variant === "split") {
    body = (
      <div className={cn("relative flex flex-col items-start gap-6 overflow-hidden rounded-[var(--t-radius)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10", d.image ? "text-white" : "bg-t-secondary text-t-secondary-fg")}>
        {bg}
        <div className="relative">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
          {text ? <p className="mt-2 max-w-xl opacity-85">{text}</p> : null}
        </div>
        <div className="relative shrink-0">{btn}</div>
      </div>
    );
  } else {
    return (
      <section id={id} className={cn("relative overflow-hidden py-16 text-center sm:py-20", d.image ? "bg-t-dark text-white" : "bg-t-primary text-t-primary-fg", className)}>
        {bg}
        <Container className="relative">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h2>
          {text ? <p className="mx-auto mt-4 max-w-2xl text-lg opacity-85">{text}</p> : null}
          <div className="mt-8">{btn}</div>
        </Container>
      </section>
    );
  }
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-12 sm:py-16", className)}>
      <Container>{body}</Container>
    </section>
  );
}

/* ---------------- About ---------------- */
export function AboutBlock({ ctx, variant = "split", className, light, id = "about", bare, data }: Common & { variant?: "split" | "centered" | "image-left"; data?: Partial<AboutData> }) {
  const d = sectionData<AboutData>(ctx, aboutSection, data);
  if (!d) return null;
  const highlights = d.highlights?.length ? (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {d.highlights.map((h, i) => (
        <li key={i} className="flex items-center gap-3 text-sm font-medium">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4", light ? "bg-white/10 text-t-accent" : "bg-t-primary/10 text-t-primary")}>
            <Icon name={h.icon} />
          </span>
          {t(h.text, ctx.lang)}
        </li>
      ))}
    </ul>
  ) : null;
  const textCol = (
    <div>
      <SectionHeading eyebrow={d.eyebrow} title={d.title} align={variant === "centered" ? "center" : "left"} lang={ctx.lang} light={light} className="mb-4" />
      <RichText value={d.body} lang={ctx.lang} className={cn(light ? "text-t-dark-fg/80" : "text-t-muted-fg", variant === "centered" && "mx-auto max-w-2xl")} />
      {highlights}
      <div className={cn("mt-8", variant === "centered" && "text-center")}>
        <CtaButton value={d.cta} ctx={ctx} />
      </div>
    </div>
  );
  const image = d.image ? <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-lg" /> : null;
  const body =
    variant === "centered" ? (
      <div className="mx-auto max-w-3xl text-center">
        {image ? <div className="mb-10">{image}</div> : null}
        {textCol}
      </div>
    ) : (
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {variant === "image-left" ? (
          <>
            {image ?? <div />}
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            {image}
          </>
        )}
      </div>
    );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>{body}</Container>
    </section>
  );
}

/* ---------------- Brands marquee ---------------- */
export function BrandsMarquee({ ctx, className, light, id = "brands", bare, data, speed }: Common & { data?: Partial<BrandsData>; speed?: "slow" | "normal" }) {
  const d = sectionData<BrandsData>(ctx, brandsSection, data);
  if (!d || !d.logos.length) return null;
  const logos = [...d.logos, ...d.logos];
  const body = (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul className={cn("t-marquee flex w-max items-center gap-12", speed === "slow" && "[animation-duration:60s]")} aria-hidden="true">
        {logos.map((l, i) => (
          <li key={i} className="flex h-12 w-32 items-center justify-center">
            {l.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image} alt={l.name} className={cn("max-h-12 max-w-full object-contain opacity-70 transition hover:opacity-100", light && "brightness-0 invert")} loading="lazy" />
            ) : (
              <span className={cn("font-heading text-lg font-bold", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{l.name}</span>
            )}
          </li>
        ))}
      </ul>
      <ul className="sr-only">
        {d.logos.map((l, i) => (
          <li key={i}>{l.name}</li>
        ))}
      </ul>
    </div>
  );
  if (bare) return <div className={className}>{body}</div>;
  const title = t(d.title, ctx.lang);
  return (
    <section id={id} className={cn("border-y py-10", light ? "border-white/10 bg-t-dark text-t-dark-fg" : "border-t-border bg-t-card", className)}>
      <Container>
        {title ? <p className={cn("mb-6 text-center text-xs font-bold uppercase tracking-[0.2em]", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>{title}</p> : null}
        {body}
      </Container>
    </section>
  );
}

/* ---------------- Promo strip ---------------- */
export function PromoStrip({ ctx, className, id = "promo", data }: Omit<Common, "light" | "bare"> & { data?: Partial<PromoData> }) {
  const d = sectionData<PromoData>(ctx, promoSection, data);
  if (!d) return null;
  const text = t(d.text, ctx.lang);
  if (!text) return null;
  return (
    <section id={id} className={cn("bg-t-accent text-t-accent-fg", className)} style={d.bg ? { backgroundColor: d.bg } : undefined}>
      <Container className="flex flex-col items-center justify-center gap-3 py-3 text-center sm:flex-row sm:gap-5">
        <p className="text-sm font-semibold sm:text-base">{text}</p>
        {d.code ? (
          <span className="rounded-[var(--t-radius)] border border-current/30 bg-white/20 px-3 py-1 font-mono text-sm font-bold tracking-wider" aria-label="Coupon code">
            {d.code}
          </span>
        ) : null}
        <CtaButton value={d.cta} ctx={ctx} className="text-sm font-bold underline underline-offset-4 hover:no-underline" />
      </Container>
    </section>
  );
}
