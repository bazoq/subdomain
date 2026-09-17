/**
 * travel-09 "Wanderly" (#809)
 * Instagram-style travel, magazine grid. Minimal header with wordmark, tiny nav and Instagram
 * icon (custom, no-JS drawer). Masonry hero of 5 photos with a headline overlay card. Gallery
 * block is central; packages as photo cards with minimal captions. Black/white, rose accent.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, Menu, X } from "lucide-react";
import type { TravelPackage } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, LangSwitch, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import { getGallery } from "@/modules/shared/queries";
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
  SocialLinks,
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { kindLabel, travelStrings } from "@/modules/travel/ui";
import { getFeaturedPackages } from "@/modules/travel/queries";

/* ---------- Custom minimal header ---------- */
function Header({ ctx }: TemplatePageProps) {
  const lang = ctx.lang;
  const ig = ctx.settings.social.instagram;
  return (
    <header className="sticky top-0 z-50 border-b border-t-border bg-t-bg/95 text-t-fg backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label={ctx.tenant.name}>
          {ctx.settings.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-7 w-auto max-w-[140px] object-contain" />
          ) : (
            <span className="font-heading text-lg font-extrabold uppercase tracking-[0.2em]">{ctx.tenant.name}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-xs font-medium uppercase tracking-widest text-t-muted-fg transition hover:text-t-fg">
              {t(n.label, lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch ctx={ctx} className="hidden text-xs uppercase tracking-widest sm:inline-flex" />
          {ig ? <SocialLinks social={{ instagram: ig }} size="sm" variant="ghost" className="text-t-fg" /> : null}
          <Link href="/packages" className="hidden rounded-full bg-t-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-t-primary-fg md:inline-flex">
            {t(travelStrings.packages, lang)}
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>
            <nav className="absolute end-0 top-11 z-50 w-64 border border-t-border bg-t-bg p-4 shadow-xl" aria-label="Mobile">
              {ctx.nav.map((n) => (
                <Link key={n.href} href={n.href} className="block py-2 text-sm font-medium uppercase tracking-widest">
                  {t(n.label, lang)}
                </Link>
              ))}
              <div className="mt-3 border-t border-t-border pt-3">
                <LangSwitch ctx={ctx} className="text-xs uppercase tracking-widest" />
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
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <Header ctx={ctx} />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="light" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: masonry of 5 photos + overlay card ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  let pics = [h.image, ...(h.slides ?? [])].filter(Boolean);
  if (pics.length < 5) {
    const g = await getGallery(ctx.tenant.id, "all", 8);
    pics = [...pics, ...g.map((r) => r.imageUrl)].filter(Boolean);
  }
  pics = pics.slice(0, 5);
  while (pics.length < 5) pics.push("");
  const cell = "h-full w-full object-cover";
  return (
    <section className="relative">
      <div className="grid h-[80vh] min-h-[560px] grid-cols-2 grid-rows-3 gap-1 md:grid-cols-4 md:grid-rows-2">
        <Img src={pics[0]} alt="" className={`${cell} col-span-2 row-span-2`} fallback={<Camera className="size-12 opacity-30" />} />
        <Img src={pics[1]} alt="" className={cell} fallback={<Camera className="size-8 opacity-30" />} />
        <Img src={pics[2]} alt="" className={cell} fallback={<Camera className="size-8 opacity-30" />} />
        <Img src={pics[3]} alt="" className={cell} fallback={<Camera className="size-8 opacity-30" />} />
        <Img src={pics[4]} alt="" className={cell} fallback={<Camera className="size-8 opacity-30" />} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-4 sm:items-center sm:p-10">
        <div className="pointer-events-auto max-w-lg bg-t-bg p-6 shadow-2xl sm:p-10 t-fade-up">
          {h.eyebrow ? <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-t-accent">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-t-muted-fg sm:text-base">{t(h.subtitle, lang)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary text-xs uppercase tracking-widest" icon={<ArrowUpRight className="size-4 rtl:-scale-x-100" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-xs uppercase tracking-widest text-t-fg" />
          </div>
          {h.badges?.length ? (
            <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-t-muted-fg">{h.badges.map((b) => b.text).join(" · ")}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------- Signature: photo package cards with minimal captions ---------- */
function PhotoCard({ pkg, ctx }: { pkg: TravelPackage; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const title = t(pkg.title as LocalizedString, lang);
  return (
    <article className="group relative">
      <div className="overflow-hidden">
        <Img src={pkg.images[0]} alt={title} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Camera className="size-10 opacity-30" />} />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-t-muted-fg">
            {kindLabel(pkg.kind, lang)} · {pkg.days}D
          </p>
          <h3 className="font-heading mt-1 truncate text-base font-bold">
            <Link href={`/packages/${pkg.slug}`} className="after:absolute after:inset-0">
              {title}
            </Link>
          </h3>
        </div>
        <p className="shrink-0 text-sm font-semibold text-t-accent">{formatPKR(pkg.price, { compact: true })}</p>
      </div>
    </article>
  );
}

async function Packages({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  if (!fp) return null;
  const items = await getFeaturedPackages(ctx.tenant.id, fp.count || 8);
  if (!items.length) return null;
  return (
    <section id="packages" className="py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-t-fg pb-4">
          <SectionHeading eyebrow={fp.eyebrow} title={fp.title} align="left" lang={ctx.lang} className="mb-0 [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_.t-eyebrow]:text-t-accent" />
          <CtaButton value={fp.cta} ctx={ctx} className="hidden text-xs font-bold uppercase tracking-widest underline-offset-4 hover:underline sm:inline-flex" icon={<ArrowUpRight className="size-4 rtl:-scale-x-100" />} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((p) => (
            <PhotoCard key={p.id} pkg={p} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Destinations: magazine strip ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={ctx.lang} className="[&_.t-eyebrow]:text-t-accent" />
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group block">
                <div className="overflow-hidden">
                  <Img src={it.image} alt="" className="aspect-square w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                </div>
                <p className="font-heading mt-3 text-lg font-bold">{t(it.name, ctx.lang)}</p>
                {it.note ? <p className="text-xs uppercase tracking-widest text-t-muted-fg">{it.note}</p> : null}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Umrah: full-width photo statement ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="grid lg:grid-cols-2">
      <Img src={u.image} alt="" className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full" fallback={<Camera className="size-14 opacity-30" />} />
      <div className="flex flex-col justify-center bg-t-dark p-8 text-t-dark-fg sm:p-16">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-t-accent">{lang === "ur" ? "عمرہ" : "Umrah"}</span>
        <h2 className="font-heading mt-3 text-3xl font-extrabold sm:text-4xl">{t(u.title, lang)}</h2>
        <p className="mt-4 text-t-dark-fg/75">{t(u.text, lang)}</p>
        {u.points?.length ? (
          <ul className="mt-6 space-y-1 text-sm uppercase tracking-widest text-t-dark-fg/80">
            {u.points.map((p, i) => (
              <li key={i}>— {t(p.text, lang)}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8">
          <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-accent text-xs uppercase tracking-widest" />
        </div>
      </div>
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
        services: () => <ServicesBlock ctx={ctx} variant="list" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted [&_li]:border-0 [&_li]:bg-transparent" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-fg bg-t-bg" />,
        about: () => <AboutBlock ctx={ctx} variant="centered" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={4} take={16} className="[&_.t-eyebrow]:text-t-accent" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="stacked" formKey="contact" subjectOptions={["Group trip", "Custom trip", "Collab", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
