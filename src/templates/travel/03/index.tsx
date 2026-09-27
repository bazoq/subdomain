/**
 * travel-03 "North Trails" (#803)
 * Adventure tours, mountains, green. Transparent header over a full-screen mountain hero
 * (solid on scroll), huge headline, departure-dates chip. Packages as tall image cards with
 * day-count badge; destinations as a horizontal scroll strip. Photo-led, green CTAs, wide sections.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronDown, MapPin, Mountain, Check } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
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
import { kindLabel, parseDepartures, travelStrings } from "@/modules/travel/ui";
import { getFeaturedPackages } from "@/modules/travel/queries";

/* ---------- Layout: transparent header over hero, dark band on inner pages ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <div className="relative flex flex-1 flex-col">
        {/* dark band sits behind the transparent header on inner pages; the home hero slides under it */}
        <div className="h-16 w-full bg-t-dark lg:h-20" aria-hidden="true" />
        <SiteHeader ctx={ctx} variant="transparent" cta={{ label: { en: "Explore tours", ur: "ٹور دیکھیں" }, href: "/packages" }} />
        <main id="main" className="flex-1">{children}</main>
      </div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: full-screen mountain image ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const pkgs = await getFeaturedPackages(ctx.tenant.id, 8);
  const next = Array.from(new Set(pkgs.flatMap((p) => parseDepartures(p.departures, true).slice(0, 1)))).sort().slice(0, 4);
  return (
    <section className="relative -mt-16 flex min-h-[92vh] items-end overflow-hidden bg-t-dark text-t-dark-fg lg:-mt-20">
      <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Mountain className="size-28 opacity-20" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-dark via-t-dark/40 to-t-dark/30" aria-hidden="true" />
      <Container className="relative pb-20 pt-40 lg:pb-28">
        <div className="max-w-4xl t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-t-accent">
              <MapPin className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/85">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-dark-fg" />
          </div>
          {next.length ? (
            <div className="mt-10 inline-flex flex-wrap items-center gap-3 rounded-full border border-t-dark-fg/20 bg-t-dark-fg/10 px-4 py-2 text-sm backdrop-blur">
              <span className="flex items-center gap-2 font-semibold text-t-accent">
                <CalendarDays className="size-4" /> {lang === "ur" ? "اگلی روانگیاں" : "Next departures"}
              </span>
              {next.map((d) => (
                <span key={d} className="rounded-full bg-t-dark-fg/15 px-2.5 py-0.5">
                  {new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <ChevronDown className="absolute bottom-6 end-6 size-8 animate-bounce text-t-dark-fg/60" aria-hidden="true" />
      </Container>
    </section>
  );
}

/* ---------- Signature: tall image package cards ---------- */
function TallCard({ pkg, ctx }: { pkg: TravelPackage; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  return (
    <article className="group relative aspect-[3/4] overflow-hidden rounded-[var(--t-radius)] bg-t-dark text-t-dark-fg shadow-md">
      <Img src={pkg.images[0]} alt={title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Mountain className="size-12 opacity-30" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-dark/95 via-t-dark/30 to-transparent" aria-hidden="true" />
      <span className="absolute start-4 top-4 rounded-full bg-t-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-accent-fg">
        {pkg.days} {lang === "ur" ? "دن" : `Day${pkg.days === 1 ? "" : "s"}`}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-t-accent">{kindLabel(pkg.kind, lang)} · {pkg.destination}</p>
        <h3 className="font-heading mt-1 text-2xl font-bold leading-tight">
          <Link href={`/packages/${pkg.slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-t-dark-fg/80">
          {t(travelStrings.from, lang)} <span className="font-bold text-t-dark-fg">{formatPKR(pkg.price)}</span>
        </p>
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
    <section id="packages" className="py-16 sm:py-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={fp.eyebrow} title={fp.title} align="left" lang={ctx.lang} className="mb-0" />
          <CtaButton value={fp.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <TallCard key={p.id} pkg={p} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: horizontal destinations strip ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="overflow-hidden bg-t-muted py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={ctx.lang} />
      </Container>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {d.items.map((it, i) => (
          <SmartLink key={i} href={it.href || "/packages"} ctx={ctx} className="group relative w-72 shrink-0 snap-start overflow-hidden rounded-[var(--t-radius)] bg-t-dark sm:w-80">
            <Img src={it.image} alt={t(it.name, ctx.lang)} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Mountain className="size-10 opacity-30" />} />
            <div className="absolute inset-0 bg-gradient-to-t from-t-dark/90 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-t-dark-fg">
              <p className="font-heading text-2xl font-bold">{t(it.name, ctx.lang)}</p>
              {it.note ? <p className="mt-1 text-sm text-t-accent">{it.note}</p> : null}
            </div>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}

/* ---------- Umrah highlight (photo band) ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={u.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" fallback={<span />} />
      <Container className="relative grid gap-8 py-16 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-bold sm:text-5xl">{t(u.title, lang)}</h2>
          <p className="mt-4 text-lg text-t-dark-fg/85">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="size-4 text-t-accent" /> {t(p.text, lang)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
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
        services: () => <ServicesBlock ctx={ctx} variant="image" columns={3} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={4} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Hunza", "Skardu", "Swat", "Naran", "Custom tour", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
