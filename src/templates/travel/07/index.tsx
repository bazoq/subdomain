/**
 * travel-07 "Desert Rose" (#807)
 * Dubai & Gulf getaways, sand & sunset. Sand header with terracotta logo. Sunset-gradient hero
 * with a skyline silhouette, headline and package-kind tabs. Packages as postcard cards;
 * destinations strip with sunset overlays. Warm gradients, rounded-lg, postcard motifs.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, MapPin, Stamp, Sunset } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { PackageTabs, durationText, kindLabel, travelStrings } from "@/modules/travel/ui";
import { getFeaturedPackages } from "@/modules/travel/queries";

/* ---------- Layout: sand header ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader ctx={ctx} variant="light" cta={{ label: { en: "Explore packages", ur: "پیکجز دیکھیں" }, href: "/packages" }} className="bg-t-muted/95 [&_a>span.font-heading]:text-t-primary" />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Skyline silhouette (inline SVG, currentColor) ---------- */
function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={className} aria-hidden="true" fill="currentColor">
      <path d="M0 160V120h40V90h20v30h30V70h15v50h25V100h20v20h30V40l12-20 12 20v80h25V85h20v35h30V60h18v60h30V95h25v25h20V50l10-30 10 30v70h30V80h25v40h30V30l15-25 15 25v90h20V70h20v50h35V100h25v20h30V55h20v65h30V90h25v30h40V60h15v60h30V95h25v25h30V45l14-25 14 25v75h20V80h25v40h30V100h20v20h40V70h20v50h35V90h25v30h40V60l12-20 12 20v60h30V85h25v35h30V30l15-25 15 25v90h20v40z" />
    </svg>
  );
}

/* ---------- Hero: sunset gradient + skyline + tabs ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-t-accent via-t-primary to-t-secondary text-t-primary-fg">
      {h.image ? <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-multiply" /> : null}
      <div className="pointer-events-none absolute start-1/2 top-8 size-40 -translate-x-1/2 rounded-full bg-t-accent shadow-[0_0_120px_40px_rgba(255,255,255,0.25)] rtl:translate-x-1/2 sm:size-56" aria-hidden="true" />
      <Container className="relative pb-40 pt-24 text-center lg:pt-32">
        {h.eyebrow ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-t-secondary/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] backdrop-blur">
            <Sunset className="size-4" /> {h.eyebrow}
          </span>
        ) : null}
        <h1 className="font-heading mx-auto mt-6 max-w-4xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-t-primary-fg/85">{t(h.subtitle, lang)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn bg-t-secondary text-t-secondary-fg hover:brightness-110" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary-fg" />
        </div>
        <div className="mt-10 flex justify-center">
          <PackageTabs ctx={ctx} showEmpty className="[&_a]:border-white/30 [&_a]:bg-white/10 [&_a]:text-t-primary-fg [&_a]:backdrop-blur [&_a:hover]:bg-white/25 [&_a:hover]:text-t-primary-fg [&_a[aria-current=page]]:bg-t-secondary [&_a[aria-current=page]]:border-t-secondary" />
        </div>
      </Container>
      <Skyline className="absolute inset-x-0 bottom-0 h-24 w-full text-t-secondary sm:h-32" />
    </section>
  );
}

/* ---------- Signature: postcard package cards ---------- */
function Postcard({ pkg, ctx }: { pkg: TravelPackage; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden rounded-[calc(var(--t-radius)-4px)]">
        <Img src={pkg.images[0]} alt={title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Sunset className="size-10 opacity-30" />} />
        <div className="absolute inset-0 bg-gradient-to-t from-t-primary/60 to-transparent" aria-hidden="true" />
        <span className="absolute end-3 top-3 flex size-14 rotate-6 items-center justify-center rounded-sm border-2 border-dashed border-white/80 bg-t-accent/90 text-[10px] font-extrabold uppercase leading-tight text-t-accent-fg">
          {pkg.days}D
          <br />
          {pkg.nights}N
        </span>
        <span className="absolute bottom-3 start-3 flex items-center gap-1 text-xs font-semibold text-white">
          <MapPin className="size-3.5" /> {pkg.destination}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-t-primary">{kindLabel(pkg.kind, lang)}</p>
        <h3 className="font-heading text-xl leading-snug">
          <Link href={`/packages/${pkg.slug}`} className="after:absolute after:inset-0 hover:text-t-primary">
            {title}
          </Link>
        </h3>
        <p className="text-sm text-t-muted-fg">{durationText(pkg, lang)}</p>
        <div className="mt-auto flex items-end justify-between border-t border-dashed border-t-border pt-3">
          <p className="text-sm text-t-muted-fg">
            {t(travelStrings.from, lang)} <span className="font-heading text-xl text-t-primary">{formatPKR(pkg.price)}</span>
          </p>
          <Stamp className="size-5 text-t-accent" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

async function Packages({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  if (!fp) return null;
  const items = await getFeaturedPackages(ctx.tenant.id, fp.count || 6);
  if (!items.length) return null;
  return (
    <section id="packages" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={fp.eyebrow} title={fp.title} lang={ctx.lang} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Postcard key={p.id} pkg={p} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={fp.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: destinations strip with sunset overlays ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--t-radius)] bg-t-secondary">
                <Img src={it.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Sunset className="size-10 opacity-30" />} />
                <div className="absolute inset-0 bg-gradient-to-t from-t-secondary via-t-primary/50 to-t-accent/10 opacity-90 transition group-hover:opacity-75" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-t-primary-fg">
                  <p className="font-heading text-2xl">{t(it.name, ctx.lang)}</p>
                  {it.note ? <p className="mt-1 text-sm text-t-accent">{it.note}</p> : null}
                </div>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Umrah ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <span className="t-eyebrow">{lang === "ur" ? "عمرہ" : "Umrah"}</span>
          <h2 className="font-heading mt-2 text-3xl sm:text-4xl">{t(u.title, lang)}</h2>
          <p className="mt-4 text-lg text-t-muted-fg">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-center gap-2 rounded-[var(--t-radius)] bg-t-muted px-3 py-2 text-sm font-medium">
                  <Check className="size-4 text-t-primary" /> {t(p.text, lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary" />
          </div>
        </div>
        <div className="order-1 rotate-1 rounded-[var(--t-radius)] border border-t-border bg-t-card p-3 shadow-lg lg:order-2">
          <Img src={u.image} alt="" className="aspect-[4/3] w-full rounded-[calc(var(--t-radius)-4px)] object-cover" fallback={<Icon name="Moon" className="size-14 opacity-30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredPackages: () => <Packages ctx={ctx} />,
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="bg-t-muted" />,
        features: () => <FeaturesBlock ctx={ctx} variant="alternating" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="bg-gradient-to-r from-t-secondary to-t-primary" />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="bg-gradient-to-r from-t-accent via-t-primary to-t-secondary" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Dubai", "Baku", "Istanbul", "Desert safari", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
