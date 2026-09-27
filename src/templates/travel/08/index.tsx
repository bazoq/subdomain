/**
 * travel-08 "Visa Desk" (#808)
 * Visa consultancy first, navy & mint. White header with navy logo + stamp icon (custom, no-JS
 * drawer) and "Check visa requirements". Two-column hero: headline + country select card that
 * links to /services, passport photo. Services block prominent as checklist cards with
 * "Documents required"; process with stamps. Clean, navy/mint, document motifs.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FileCheck2, Menu, Stamp, X } from "lucide-react";
import type { Service } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, processSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, LangSwitch, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { asLocalizedList } from "@/modules/shared/content-types";
import type { HeadingData } from "@/modules/shared/ui/section-types";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  SiteFooter,
  StatsBlock,
  TestimonialsBlock,
  servicePriceLabel,
} from "@/modules/shared/ui";
import { FeaturedPackages, UmrahHighlights } from "@/modules/travel/ui";

const CTA = { label: { en: "Check visa requirements", ur: "ویزا تقاضے دیکھیں" }, href: "/services" };

/* ---------- Custom header: navy logo with stamp icon ---------- */
function Header({ ctx }: TemplatePageProps) {
  const lang = ctx.lang;
  return (
    <header className="sticky top-0 z-50 border-b border-t-border bg-t-bg/95 text-t-fg backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="flex items-center gap-2.5" aria-label={ctx.tenant.name}>
          <span className="flex size-9 items-center justify-center rounded-[var(--t-radius)] bg-t-primary text-t-primary-fg">
            <Stamp className="size-5" />
          </span>
          {ctx.settings.branding.logoUrl ? (
            <Img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-9 w-auto max-w-40 object-contain" />
          ) : (
            <span className="font-heading text-xl font-bold tracking-tight text-t-primary lg:text-2xl">{ctx.tenant.name}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-[var(--t-radius)] px-3 py-2 text-sm font-medium transition hover:bg-t-muted hover:text-t-primary">
              {t(n.label, lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch ctx={ctx} className="hidden px-2 sm:inline-flex" />
          <SmartLink href={CTA.href} ctx={ctx} className="t-btn hidden bg-t-accent px-4 py-2.5 text-sm text-t-accent-fg md:inline-flex">
            <FileCheck2 className="size-4" /> {t(CTA.label, lang)}
          </SmartLink>
          <details className="group relative lg:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-[var(--t-radius)] hover:bg-t-muted [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              <Menu className="size-6 group-open:hidden" />
              <X className="hidden size-6 group-open:block" />
            </summary>
            <nav className="t-card absolute end-0 top-12 z-50 w-72 p-3 shadow-xl" aria-label="Mobile">
              {ctx.nav.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-[var(--t-radius)] px-3 py-2.5 text-base font-medium hover:bg-t-muted">
                  {t(n.label, lang)}
                </Link>
              ))}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-t-border pt-3">
                <LangSwitch ctx={ctx} />
                <SmartLink href={CTA.href} ctx={ctx} className="t-btn bg-t-accent px-4 py-2 text-sm text-t-accent-fg">
                  {t(CTA.label, lang)}
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
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <Header ctx={ctx} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: two-column, country select card ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const countries = (section(ctx, destinationsSection)?.items ?? []).map((d) => t(d.name, lang)).filter(Boolean);
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-[var(--t-radius)] bg-t-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-t-primary">
              <Stamp className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          {/* country select card → /services */}
          <form action="/services" method="get" className="t-card mt-8 flex max-w-lg flex-col gap-2 p-2 shadow-lg sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">{lang === "ur" ? "ملک" : "Country"}</span>
              <select name="country" defaultValue="" className="t-input h-full">
                <option value="">{lang === "ur" ? "ملک منتخب کریں" : "Select a country"}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="t-btn t-btn-primary">
              <FileCheck2 className="size-4" /> {t(CTA.label, lang)}
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-ghost text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-fg">
                  <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -end-4 -top-4 h-full w-full rounded-[var(--t-radius)] border-2 border-dashed border-t-primary/40" aria-hidden="true" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-[4/5] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<Stamp className="size-16 opacity-30" />} />
          <span className="absolute -bottom-5 start-6 flex -rotate-6 items-center gap-2 rounded-[var(--t-radius)] border-2 border-t-accent bg-t-bg px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-t-primary shadow-md">
            <Check className="size-4 text-t-accent" /> {lang === "ur" ? "منظور شدہ" : "Approved"}
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: visa services as checklist cards ---------- */
function ChecklistCard({ s, ctx }: { s: Service; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const docs = asLocalizedList(s.features).slice(0, 5);
  const price = servicePriceLabel(s, lang);
  return (
    <Link href={`/services/${s.slug}`} className="t-card group flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:border-t-primary hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-5">
          <Icon name={s.icon ?? undefined} />
        </span>
        <Stamp className="size-5 text-t-accent opacity-60" aria-hidden="true" />
      </div>
      <h3 className="font-heading mt-4 text-lg font-bold group-hover:text-t-primary">{t(s.name as LocalizedString, lang)}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{t(s.summary as LocalizedString, lang)}</p>
      {docs.length ? (
        <div className="mt-4 rounded-[var(--t-radius)] bg-t-muted p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-t-muted-fg">
            <ClipboardList className="size-3.5" /> {lang === "ur" ? "درکار دستاویزات" : "Documents required"}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {docs.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-t-primary/40 bg-t-bg text-t-primary">
                  <Check className="size-3" />
                </span>
                {t(d, lang)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <span className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-t-primary">
        {price || t(ui.readMore, lang)}
        <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180" />
      </span>
    </Link>
  );
}

async function Services({ ctx }: TemplatePageProps) {
  const h = ctx.sections.services?.data as (HeadingData & { count?: number }) | undefined;
  const rows = await getServices(ctx.tenant.id, { take: h?.count || 9 });
  if (!rows.length) return null;
  return (
    <section id="services" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={h?.eyebrow} title={h?.title ?? ui.services} subtitle={h?.subtitle} lang={ctx.lang} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <ChecklistCard key={s.id} s={s} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/services" className="t-btn t-btn-primary">
            {t(ui.services, ctx.lang)} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: process with stamps ---------- */
function StampProcess({ ctx }: TemplatePageProps) {
  const p = section(ctx, processSection);
  if (!p || !p.steps?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="process" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container>
        <SectionHeading eyebrow={p.eyebrow} title={p.title} lang={lang} light />
        <ol className="grid gap-8 sm:grid-cols-3">
          {p.steps.map((s, i) => (
            <li key={i} className="relative text-center">
              <span className="mx-auto flex size-24 -rotate-6 items-center justify-center rounded-full border-4 border-double border-t-accent text-t-accent [&_svg]:size-9">
                <Icon name={s.icon} />
              </span>
              <span className="mt-4 block text-xs font-bold uppercase tracking-[0.25em] text-t-accent">{lang === "ur" ? `مرحلہ ${i + 1}` : `Step ${i + 1}`}</span>
              <h3 className="font-heading mt-1 text-lg font-bold">{t(s.title, lang)}</h3>
              <p className="mt-2 text-sm text-t-dark-fg/70">{t(s.text, lang)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Destinations: country list ---------- */
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
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="t-card group flex items-center gap-4 p-3 transition hover:border-t-primary">
                <Img src={it.image} alt="" className="size-16 shrink-0 rounded-[var(--t-radius)] object-cover" />
                <span className="min-w-0">
                  <span className="font-heading block truncate font-bold group-hover:text-t-primary">{t(it.name, ctx.lang)}</span>
                  {it.note ? <span className="block truncate text-xs text-t-muted-fg">{it.note}</span> : null}
                </span>
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
        <Img src={u.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<Icon name="Moon" className="size-14 opacity-30" />} />
        <div>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">{t(u.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 space-y-2">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium">
                  <Check className="size-4 text-t-accent" /> {t(p.text, lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary" />
          </div>
        </div>
      </Container>
      <UmrahHighlights ctx={ctx} showPackages={false} className="pb-0 pt-14 sm:pb-0" />
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        services: () => <Services ctx={ctx} />,
        process: () => <StampProcess ctx={ctx} />,
        featuredPackages: () => (fp ? <FeaturedPackages ctx={ctx} take={fp.count || 6} eyebrow={fp.eyebrow} title={fp.title} /> : null),
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="bg-t-bg" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Visit visa", "Study visa", "Work visa", "Tickets", "Package", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
