/**
 * printing-04 "Signage Studio" (#204)
 * Large-format signage house in dark navy with yellow accents: yellow rule over a dark
 * header, a full-bleed wide banner hero with an Oswald all-caps headline and yellow service
 * chips, service cards that carry size/material notes, portfolio as wide landscape tiles and
 * a client logo strip.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Ruler } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { portfolioSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
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
} from "@/modules/shared/ui";
import type { GalleryHeadingData, HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { HowItWorks, PrintServicesGrid } from "@/modules/printing/ui";

type ServicesHeading = HeadingData & { count?: number };

const PRINT_SUBJECTS = ["Flex banner", "Signboard / ACP", "Vehicle branding", "Exhibition & standee", "Acrylic & neon", "Window vinyl", "Other"];

function quoteLink(ctx: SiteContext): LinkData {
  const hero = ctx.sections.hero?.data as { primaryCta?: LinkData } | undefined;
  const label = t(hero?.primaryCta?.label, ctx.lang);
  return { label: label && hero?.primaryCta ? hero.primaryCta.label : ui.getQuote, href: "/quote" };
}

/* ---------- Layout: yellow rule + dark navy header ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <div className="h-1 w-full bg-t-primary" aria-hidden="true" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={quoteLink(ctx)}
        className="border-b border-t-border [&>div>a>span]:uppercase [&>div>a>span]:tracking-wide [&>div>a>span]:text-t-primary [&_nav_a]:text-sm [&_nav_a]:uppercase [&_nav_a]:tracking-wide"
      />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: full-bleed wide banner, condensed caps headline, service chips ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const primary: LinkData = { label: t(h.primaryCta?.label, lang) ? h.primaryCta.label : ui.getQuote, href: h.primaryCta?.href || "/quote" };
  return (
    <section className="relative isolate overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? <Img src={h.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" /> : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-t-bg via-t-dark/80 to-t-dark/40" aria-hidden="true" />
      <Container className="flex min-h-[26rem] flex-col justify-end py-16 lg:min-h-[34rem] lg:py-24">
        <div className="t-fade-up max-w-4xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 border-s-4 border-t-primary ps-3 text-xs font-bold uppercase tracking-[0.25em] text-t-primary">{h.eyebrow}</span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-t-dark-fg/75">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={primary} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wide text-t-primary" />
          </div>
        </div>
      </Container>
      {h.badges?.length ? (
        <div className="relative border-t border-t-border bg-t-muted/80">
          <Container>
            <ul className="no-scrollbar flex gap-2 overflow-x-auto py-4">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex shrink-0 items-center gap-2 rounded-[var(--t-radius)] bg-t-primary/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-t-primary">
                  <span className="[&_svg]:size-3.5">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </Container>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Portfolio: wide landscape tiles ---------- */
function WidePortfolio({ ctx }: TemplatePageProps) {
  const d = sectionData<GalleryHeadingData>(ctx, portfolioSection);
  if (!d) return null;
  return <GalleryBlock ctx={ctx} id="portfolio" album={d.album || "portfolio"} heading={d} variant="masonry" columns={2} take={10} className="bg-t-muted [&_h2]:uppercase" />;
}

function QuoteStrip({ ctx }: TemplatePageProps) {
  return (
    <section className="border-t border-t-border bg-t-muted py-6">
      <Container className="flex justify-center">
        <Link href="/quote" className="t-btn t-btn-primary uppercase tracking-wide">
          <Ruler className="size-4" /> {t(ui.getQuote, ctx.lang)}
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
        services: () => <PrintServicesGrid ctx={ctx} columns={2} take={svc?.count ?? 8} heading={svc ?? undefined} showFeatures className="[&_h2]:uppercase" />,
        process: () => <HowItWorks ctx={ctx} variant="steps" className="bg-t-muted [&_h2]:uppercase" />,
        portfolio: () => <WidePortfolio ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_h2]:uppercase" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" light />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted [&_h2]:uppercase" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted [&_h2]:uppercase" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="[&_h2]:uppercase" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-muted" />,
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
