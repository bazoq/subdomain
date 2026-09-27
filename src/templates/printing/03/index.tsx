/**
 * printing-03 "QuickPrint 24" (#203)
 * Fast-turnaround orange & black shop: black header with an orange condensed wordmark and a
 * live turnaround badge, an urgent all-caps hero with the PriceEstimator card sitting beside
 * it on the dark band, services as compact rows with orange price + turnaround chips, a
 * compact process and a scrollable portfolio strip.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Timer, Zap } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { portfolioSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import {
  AboutBlock,
  AnnouncementBar,
  BrandsMarquee,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
  sectionData,
  servicePriceLabel,
} from "@/modules/shared/ui";
import type { GalleryHeadingData, HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { HowItWorks, PriceEstimator } from "@/modules/printing/ui";

type ServicesHeading = HeadingData & { count?: number };
type HeroBadge = { text: string; icon: string };

const PRINT_SUBJECTS = ["Business cards", "Flyers", "Posters", "Stickers", "Banners", "Binding & photocopy", "Other"];

function quoteLink(ctx: SiteContext): LinkData {
  const hero = ctx.sections.hero?.data as { primaryCta?: LinkData } | undefined;
  const label = t(hero?.primaryCta?.label, ctx.lang);
  return { label: label && hero?.primaryCta ? hero.primaryCta.label : ui.getQuote, href: "/quote" };
}

/** Header badge built from the tenant's first hero trust badge (e.g. "24-hr turnaround"). */
function TurnaroundBadge({ ctx }: TemplatePageProps) {
  const hero = ctx.sections.hero?.data as { badges?: HeroBadge[] } | undefined;
  const b = hero?.badges?.find((x) => x.text?.trim());
  if (!b) return null;
  return (
    <span className="hidden items-center gap-1.5 rounded-[var(--t-radius)] bg-t-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-t-primary-fg lg:inline-flex">
      <span className="[&_svg]:size-3.5">
        <Icon name={b.icon} />
      </span>
      {b.text}
    </span>
  );
}

/* ---------- Layout: black header, orange condensed wordmark ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={quoteLink(ctx)}
        className="[&>div>a>span]:uppercase [&>div>a>span]:text-t-primary [&_nav_a]:text-sm [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-wide"
        rightSlot={<TurnaroundBadge ctx={ctx} />}
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: urgent condensed type + price estimator beside it ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const primary: LinkData = { label: t(h.primaryCta?.label, lang) ? h.primaryCta.label : ui.getQuote, href: h.primaryCta?.href || "/quote" };
  return (
    <section className="relative isolate overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? <Img src={h.image} alt="" priority className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25" /> : null}
      <span className="absolute -top-24 end-[-6rem] -z-10 h-[28rem] w-[28rem] rotate-12 bg-t-primary/20" aria-hidden="true" />
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 bg-t-primary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">
              <Zap className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 break-words text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-dark-fg/75">{t(h.subtitle, lang)}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaButton value={primary} ctx={ctx} className="t-btn t-btn-primary text-base font-bold uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wide text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full border border-t-primary/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-t-primary">
                  <span className="[&_svg]:size-3.5">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <PriceEstimator ctx={ctx} light quoteHref="/quote" className="shadow-2xl" />
      </Container>
    </section>
  );
}

/* ---------- Signature: services as compact rows with price + turnaround chips ---------- */
async function SpeedServices({ ctx }: TemplatePageProps) {
  const d = sectionData<ServicesHeading>(ctx, servicesSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: d.count ?? 8 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="print-services" className="bg-t-bg py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} className="[&_h2]:uppercase" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((s) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            const price = servicePriceLabel({ priceFrom: s.priceFrom, priceNote: null }, lang);
            return (
              <li key={s.id}>
                <Link href={`/services/${s.slug}`} className="t-card group relative flex h-full items-start gap-4 overflow-hidden p-5 ps-7 transition hover:bg-t-muted">
                  <span className="absolute inset-y-0 start-0 w-1.5 bg-t-primary" aria-hidden="true" />
                  <span className="flex size-11 shrink-0 items-center justify-center bg-t-primary/15 text-t-primary [&_svg]:size-5">
                    <Icon name={s.icon ?? undefined} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-heading block text-xl font-bold uppercase tracking-tight text-t-fg group-hover:text-t-primary">{name}</span>
                    {summary ? <span className="mt-1 line-clamp-2 block text-sm text-t-muted-fg">{summary}</span> : null}
                    <span className="mt-3 flex flex-wrap items-center gap-2">
                      {price ? <span className="bg-t-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-t-primary-fg">{price}</span> : null}
                      {s.priceNote ? (
                        <span className="inline-flex items-center gap-1 border border-t-border px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-t-muted-fg">
                          <Timer className="size-3.5" /> {s.priceNote}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-t-muted-fg transition group-hover:translate-x-1 group-hover:text-t-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Portfolio: scrollable strip of recent jobs ---------- */
function PortfolioStrip({ ctx }: TemplatePageProps) {
  const d = sectionData<GalleryHeadingData>(ctx, portfolioSection);
  if (!d) return null;
  return <GalleryBlock ctx={ctx} id="portfolio" album={d.album || "portfolio"} heading={d} variant="strip" take={14} className="bg-t-muted py-14 sm:py-16 [&_h2]:uppercase" />;
}

function QuoteStrip({ ctx }: TemplatePageProps) {
  return (
    <section className="bg-t-dark py-6 text-t-dark-fg">
      <Container className="flex justify-center">
        <Link href="/quote" className="t-btn t-btn-primary text-base font-bold uppercase tracking-wide">
          <Zap className="size-4" /> {t(ui.getQuote, ctx.lang)}
        </Link>
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
        services: () => <SpeedServices ctx={ctx} />,
        process: () => <HowItWorks ctx={ctx} variant="steps" className="bg-t-muted py-12 sm:py-14 [&_h2]:uppercase" />,
        portfolio: () => <PortfolioStrip ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="py-14 sm:py-16 [&_h2]:uppercase" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="[&_dd]:uppercase" />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className="bg-t-muted [&_h2]:uppercase" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="[&_h2]:uppercase" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted [&_h2]:uppercase" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase" />,
        contact: () => (
          <>
            <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={PRINT_SUBJECTS} className="[&_h2]:uppercase" />
            <QuoteStrip ctx={ctx} />
          </>
        ),
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
