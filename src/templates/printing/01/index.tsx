/**
 * printing-01 "PrintPress" (#201)
 * CMYK bold, services-first digital & offset printer: white page, a four-band registration
 * colour bar above the header and below the content, a magenta "Get a quote" button in the
 * header, split hero with a print-sample collage, services grid with "From Rs" tags,
 * masonry portfolio and a full-width magenta quote band.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Printer, Upload } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { ctaSection, heroSection } from "@/templates/shared/sections";
import { portfolioSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  BrandsMarquee,
  ContactBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { CtaData, GalleryHeadingData, HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { HowItWorks, PrintServicesGrid } from "@/modules/printing/ui";

type ServicesHeading = HeadingData & { count?: number };

const PRINT_SUBJECTS = ["Business cards", "Flyers & brochures", "Banners & flex", "Packaging", "Wedding cards", "Stickers & labels", "Other"];

/** Quote button label: the tenant's own hero button text, falling back to the shared UI string. */
function quoteLink(ctx: SiteContext): LinkData {
  const hero = ctx.sections.hero?.data as { primaryCta?: LinkData } | undefined;
  const label = t(hero?.primaryCta?.label, ctx.lang);
  return { label: label && hero?.primaryCta ? hero.primaryCta.label : ui.getQuote, href: "/quote" };
}

/** Signature: CMYK registration bar (theme tokens stand in for C / M / Y / K). */
function ColourBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-full", className)} aria-hidden="true">
      <span className="flex-1 bg-t-primary" />
      <span className="flex-1 bg-t-accent" />
      <span className="flex-1 bg-t-primary/40" />
      <span className="flex-1 bg-t-secondary" />
    </div>
  );
}

/* ---------- Layout: colour bar + white header with a magenta quote button ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const q = quoteLink(ctx);
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <ColourBar />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={null}
        className="[&>div>a>span]:tracking-tight"
        rightSlot={
          <Link href={q.href} className="t-btn t-btn-accent px-3 py-2 text-xs sm:px-4 sm:text-sm">
            <Upload className="size-4" /> {t(q.label, ctx.lang)}
          </Link>
        }
      />
      <main id="main" className="flex-1">{children}</main>
      <ColourBar />
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: split, print-sample collage, upload CTA ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const primary: LinkData = { label: t(h.primaryCta?.label, lang) ? h.primaryCta.label : ui.getQuote, href: h.primaryCta?.href || "/quote" };
  const tiles = (h.slides ?? []).filter(Boolean).slice(0, 4);
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-[var(--t-radius)] bg-t-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-primary">
              <Printer className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={primary} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2.5">
              {h.badges.map((b, i) => (
                <li
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[var(--t-radius)] border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                    i % 2 ? "border-t-accent text-t-accent" : "border-t-primary text-t-primary",
                  )}
                >
                  <span className="[&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* print-sample collage */}
        <div className="relative">
          <span className="absolute -start-3 -top-3 size-16 bg-t-primary/20" aria-hidden="true" />
          <span className="absolute -bottom-3 -end-3 size-16 bg-t-accent/20" aria-hidden="true" />
          {tiles.length >= 2 ? (
            <div className="relative grid grid-cols-2 gap-3">
              {tiles.map((src, i) => (
                <Img
                  key={i}
                  src={src}
                  alt=""
                  className={cn("w-full rounded-[var(--t-radius)] object-cover shadow-md", i === 0 || i === 3 ? "aspect-[4/5]" : "aspect-square")}
                  fallback={<Printer className="size-8 opacity-30" />}
                />
              ))}
            </div>
          ) : (
            <Img src={h.image} alt="" priority className="relative aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-lg" fallback={<Printer className="size-16 opacity-25" />} />
          )}
        </div>
      </Container>
      <ColourBar className="h-1" />
    </section>
  );
}

/* ---------- Portfolio: masonry of gallery album ---------- */
function PortfolioMasonry({ ctx }: TemplatePageProps) {
  const d = sectionData<GalleryHeadingData>(ctx, portfolioSection);
  if (!d) return null;
  return <GalleryBlock ctx={ctx} id="portfolio" album={d.album || "portfolio"} heading={d} variant="masonry" columns={3} take={12} className="border-t border-t-border" />;
}

/* ---------- Signature CTA: magenta quote band ---------- */
function QuoteBand({ ctx }: TemplatePageProps) {
  const d = sectionData<CtaData>(ctx, ctaSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  const text = t(d.text, ctx.lang);
  if (!title && !text) return null;
  return (
    <section id="cta" className="bg-t-accent text-t-accent-fg">
      <Container className="flex flex-col items-center gap-5 py-14 text-center sm:py-16">
        <span className="flex size-12 items-center justify-center rounded-full bg-t-accent-fg/20" aria-hidden="true">
          <Upload className="size-6" />
        </span>
        {title ? <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2> : null}
        {text ? <p className="max-w-2xl text-lg opacity-90">{text}</p> : null}
        <CtaButton value={d.cta} ctx={ctx} className="t-btn bg-t-secondary text-t-dark-fg" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </section>
  );
}

/** Small strip under the contact section pointing at the quote page. */
function QuoteStrip({ ctx }: TemplatePageProps) {
  return (
    <section className="border-t border-t-border bg-t-muted py-6">
      <Container className="flex justify-center">
        <Link href="/quote" className="t-btn t-btn-accent">
          <Upload className="size-4" /> {t(ui.getQuote, ctx.lang)}
        </Link>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const svc = sectionData<ServicesHeading>(ctx, servicesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        services: () => <PrintServicesGrid ctx={ctx} columns={3} take={svc?.count ?? 8} heading={svc ?? undefined} className="bg-t-muted" />,
        process: () => <HowItWorks ctx={ctx} variant="steps" />,
        portfolio: () => <PortfolioMasonry ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" light />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <QuoteBand ctx={ctx} />,
        contact: () => (
          <>
            <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={PRINT_SUBJECTS} className="bg-t-muted" />
            <QuoteStrip ctx={ctx} />
          </>
        ),
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
