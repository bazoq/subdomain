/**
 * travel-05 "Safar Luxury" (#805)
 * Luxury honeymoon & Europe, black & gold. Black header with gold serif logo and spaced
 * uppercase nav (custom, no-JS drawer). Full-bleed resort photo hero with serif headline and
 * "Plan my trip" CTA. Packages as large editorial cards; destinations as gold-framed images.
 * Dark luxury, square corners, gold rules.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Menu, Sparkles, X } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, LangSwitch, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
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
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { durationText, kindLabel, travelStrings } from "@/modules/travel/ui";
import { getFeaturedPackages } from "@/modules/travel/queries";

/* ---------- Custom header: black, gold serif logo, spaced uppercase nav ---------- */
function Header({ ctx }: TemplatePageProps) {
  const lang = ctx.lang;
  const cta = { label: { en: "Plan my trip", ur: "میرا سفر پلان کریں" }, href: "/contact" };
  const navLink = "text-[11px] font-semibold uppercase tracking-[0.3em] text-t-fg/80 transition hover:text-t-primary";
  return (
    <header className="sticky top-0 z-50 border-b border-t-primary/30 bg-t-dark/95 text-t-fg backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2" aria-label={ctx.tenant.name}>
          {ctx.settings.branding.logoUrl ? (
            <Img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-10 w-auto max-w-40 object-contain" />
          ) : (
            <span className="font-heading text-2xl font-semibold tracking-[0.15em] text-t-primary uppercase">{ctx.tenant.name}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} className={navLink}>
              {t(n.label, lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LangSwitch ctx={ctx} className="hidden text-t-fg/80 hover:text-t-primary sm:inline-flex" />
          <SmartLink href={cta.href} ctx={ctx} className="hidden border border-t-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-t-primary transition hover:bg-t-primary hover:text-t-primary-fg md:inline-flex">
            {t(cta.label, lang)}
          </SmartLink>
          {/* no-JS mobile drawer */}
          <details className="group relative lg:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center text-t-fg [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              <Menu className="size-6 group-open:hidden" />
              <X className="hidden size-6 group-open:block" />
            </summary>
            <nav className="absolute end-0 top-12 z-50 w-72 border border-t-primary/30 bg-t-dark p-4 shadow-2xl" aria-label="Mobile">
              {ctx.nav.map((n) => (
                <Link key={n.href} href={n.href} className="block border-b border-t-border py-3 text-xs font-semibold uppercase tracking-[0.3em] text-t-fg/90 last:border-0">
                  {t(n.label, lang)}
                </Link>
              ))}
              <div className="mt-4 flex items-center justify-between gap-3">
                <LangSwitch ctx={ctx} className="text-t-fg/80" />
                <SmartLink href={cta.href} ctx={ctx} className="border border-t-primary px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-t-primary">
                  {t(cta.label, lang)}
                </SmartLink>
              </div>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <Header ctx={ctx} />
      <main id="main" className="flex-1">{children}</main>
      <div className="h-px w-full bg-t-primary/60" aria-hidden="true" />
      <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-primary" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: full-bleed resort photo ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-t-dark">
      <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Sparkles className="size-24 opacity-20" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/40 to-t-bg/20" aria-hidden="true" />
      <Container className="relative py-24 text-center">
        {t(h.eyebrow, lang) ? <span className="text-xs font-semibold uppercase tracking-[0.4em] text-t-primary">{t(h.eyebrow, lang)}</span> : null}
        <div className="mx-auto mt-6 h-px w-16 bg-t-primary" aria-hidden="true" />
        <h1 className="font-heading mx-auto mt-6 max-w-4xl text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-[0.25em] text-xs" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-xs uppercase tracking-[0.25em] text-t-fg" />
        </div>
        {h.badges?.length ? (
          <ul className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.3em] text-t-muted-fg">
            {h.badges.map((b, i) => (
              <li key={i}>{b.text}</li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: editorial package cards ---------- */
function EditorialCard({ pkg, ctx, flip }: { pkg: TravelPackage; ctx: TemplatePageProps["ctx"]; flip?: boolean }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  return (
    <article className={`group grid gap-0 border border-t-border lg:grid-cols-2 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <div className="relative overflow-hidden">
        <Img src={pkg.images[0]} alt={title} className="aspect-[4/3] h-full w-full object-cover transition duration-700 group-hover:scale-105 lg:aspect-auto" fallback={<Sparkles className="size-12 opacity-30" />} />
      </div>
      <div className="flex flex-col justify-center p-8 lg:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-t-primary">
          {kindLabel(pkg.kind, lang)} · {pkg.destination}
        </p>
        <h3 className="font-heading mt-4 text-3xl font-medium leading-tight sm:text-4xl">
          <Link href={`/packages/${pkg.slug}`} className="hover:text-t-primary">
            {title}
          </Link>
        </h3>
        <div className="my-6 h-px w-12 bg-t-primary" aria-hidden="true" />
        <p className="text-sm text-t-muted-fg">{durationText(pkg, lang)}</p>
        <p className="mt-2 text-sm text-t-muted-fg">
          {t(travelStrings.from, lang)} <span className="font-heading text-2xl text-t-fg">{formatPKR(pkg.price)}</span> {pkg.priceNote ? <span>· {pkg.priceNote}</span> : null}
        </p>
        <Link href={`/packages/${pkg.slug}`} className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-t-primary">
          {t(travelStrings.viewPackage, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </article>
  );
}

async function Packages({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  if (!fp) return null;
  const items = await getFeaturedPackages(ctx.tenant.id, Math.min(fp.count || 4, 6));
  if (!items.length) return null;
  return (
    <section id="packages" className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={fp.eyebrow} title={fp.title} lang={ctx.lang} className="[&_h2]:font-medium" />
        <div className="space-y-8">
          {items.map((p, i) => (
            <EditorialCard key={p.id} pkg={p} ctx={ctx} flip={i % 2 === 1} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton value={fp.cta} ctx={ctx} className="t-btn t-btn-outline text-xs uppercase tracking-[0.25em] text-t-fg" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: gold-framed destinations ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="border-y border-t-primary/30 bg-t-muted py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="[&_h2]:font-medium" />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group block">
                <div className="border border-t-primary p-2 transition group-hover:bg-t-primary/10">
                  <div className="overflow-hidden border border-t-primary/40">
                    <Img src={it.image} alt={t(it.name, ctx.lang)} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                </div>
                <p className="font-heading mt-4 text-center text-2xl">{t(it.name, ctx.lang)}</p>
                {t(it.note, ctx.lang) ? <p className="mt-1 text-center text-[11px] uppercase tracking-[0.25em] text-t-primary">{t(it.note, ctx.lang)}</p> : null}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Umrah: gold-ruled feature ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="border border-t-primary p-2">
          <Img src={u.image} alt="" className="aspect-[4/5] w-full object-cover" fallback={<Sparkles className="size-14 opacity-30" />} />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-t-primary">{lang === "ur" ? "عمرہ" : "Umrah"}</span>
          <h2 className="font-heading mt-4 text-4xl font-medium leading-tight sm:text-5xl">{t(u.title, lang)}</h2>
          <div className="my-6 h-px w-16 bg-t-primary" aria-hidden="true" />
          <p className="text-lg text-t-muted-fg">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 space-y-3">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="size-4 text-t-primary" /> {t(p.text, lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10">
            <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary text-xs uppercase tracking-[0.25em]" />
          </div>
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
        services: () => <ServicesBlock ctx={ctx} variant="list" className="border-t border-t-primary/30" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted [&_li]:border-t-primary/30" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-primary/30 bg-t-bg [&_dd]:font-medium" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="[&_h2]:font-medium" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:font-medium" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Honeymoon", "Maldives", "Turkey", "Europe", "Tailor-made", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
