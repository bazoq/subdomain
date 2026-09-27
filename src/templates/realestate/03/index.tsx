/**
 * realestate-03 "Plot Point" (#1603)
 * Earthy green & sand for plot dealers and investment advisors. Green header with a
 * WhatsApp button, map-style CSS-grid hero with an investment headline and society chips,
 * areas as society cards with "from Rs" notes, emphasised stats (ROI, plots sold) and a
 * transfer-process timeline. Grid motifs, data-forward, square-ish corners.
 */
import * as React from "react";
import { ArrowRight, LandPlot, MapPinned, TrendingUp } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, statsSection } from "@/templates/shared/sections";
import { areasSection, featuredPropertiesSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData, LinkData, StatsData } from "@/modules/shared/ui/section-types";
import { FeaturedProperties } from "@/modules/realestate/ui";

type FeaturedData = HeadingData & { count?: number; cta?: LinkData };
type AreasData = HeadingData & { items: { name: string; image: string; href: string; note: LocalizedString }[] };
type ServicesHeading = HeadingData & { count?: number };

/** Map-style grid lines (theme border colour) used behind the hero and stats. */
const GRID_BG = "bg-[linear-gradient(to_right,var(--t-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--t-border)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]";

/* ---------- Layout: green header + WhatsApp button ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader ctx={ctx} variant="dark" cta={{ label: ui.whatsapp, href: "whatsapp" }} className="bg-t-primary text-t-primary-fg [&_.t-btn-primary]:bg-t-accent [&_.t-btn-primary]:text-t-accent-fg" />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: map grid, investment headline, society chips ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const areas = sectionData<AreasData>(ctx, areasSection);
  return (
    <section className={cn("relative overflow-hidden bg-t-bg", GRID_BG)}>
      <div className="absolute inset-0 bg-gradient-to-b from-t-bg/40 via-transparent to-t-bg" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 border border-t-primary/30 bg-t-bg px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-primary">
              <MapPinned className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          {areas?.items?.length ? (
            <div className="mt-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-t-muted-fg">{t(areas.title, lang)}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {areas.items.map((a, i) => (
                  <li key={i}>
                    <SmartLink href={a.href || "/properties"} ctx={ctx} className="inline-flex items-center gap-1.5 rounded-[var(--t-radius)] border border-t-border bg-t-card px-3 py-1.5 text-sm font-medium text-t-fg transition hover:border-t-primary hover:text-t-primary">
                      <LandPlot className="size-3.5 text-t-primary" /> {a.name}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute -inset-3 border border-t-primary/20" aria-hidden="true" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-[4/3] w-full object-cover" fallback={<MapPinned className="size-16 opacity-30" />} />
          {h.badges?.length ? (
            <ul className="relative -mt-6 ms-4 me-4 grid grid-cols-2 gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 bg-t-dark px-3 py-2.5 text-xs font-semibold text-t-dark-fg shadow-lg">
                  <span className="text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: societies as cards with "from Rs" notes ---------- */
function SocietyCards({ ctx }: TemplatePageProps) {
  const d = sectionData<AreasData>(ctx, areasSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="areas" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={ctx.lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((a, i) => (
            <li key={i}>
              <SmartLink href={a.href || "/properties"} ctx={ctx} className="t-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className={cn("relative", !a.image && GRID_BG)}>
                  <Img src={a.image} alt={a.name} className="aspect-[3/2] w-full object-cover" fallback={<LandPlot className="size-10 text-t-primary/40" />} />
                  <span className="absolute start-3 top-3 flex size-8 items-center justify-center bg-t-dark text-xs font-bold text-t-dark-fg">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-lg font-bold text-t-fg group-hover:text-t-primary">{a.name}</h3>
                  {t(a.note, ctx.lang) ? (
                    <p className="mt-2 inline-flex w-fit items-center gap-1.5 bg-t-accent/15 px-2 py-1 text-xs font-bold text-t-accent">
                      <TrendingUp className="size-3.5" /> {t(a.note, ctx.lang)}
                    </p>
                  ) : null}
                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-t-primary">
                    {t(ui.viewDetails, ctx.lang)} <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: emphasised stats on dark green with grid motif ---------- */
function BigStats({ ctx }: TemplatePageProps) {
  const d = sectionData<StatsData>(ctx, statsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="stats" className="relative overflow-hidden bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,var(--t-dark-fg)_1px,transparent_1px),linear-gradient(to_bottom,var(--t-dark-fg)_1px,transparent_1px)] [background-size:2.5rem_2.5rem]" aria-hidden="true" />
      <Container className="relative">
        <dl className={cn("grid gap-px bg-t-dark-fg/10", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className="bg-t-dark p-6 sm:p-8">
              <dd className="font-heading text-4xl font-bold tracking-tight text-t-accent sm:text-5xl">{it.value}</dd>
              <dt className="mt-2 text-sm font-medium uppercase tracking-wider text-t-dark-fg/70">{t(it.label, ctx.lang)}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const featured = sectionData<FeaturedData>(ctx, featuredPropertiesSection);
  const services = sectionData<ServicesHeading>(ctx, servicesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredProperties: () => (featured ? <FeaturedProperties ctx={ctx} take={featured.count ?? 6} eyebrow={t(featured.eyebrow, ctx.lang)} title={featured.title} subtitle={featured.subtitle} className="bg-t-muted" /> : null),
        areas: () => <SocietyCards ctx={ctx} />,
        services: () => (services ? <ServicesBlock ctx={ctx} variant="icon" columns={3} take={services.count ?? 6} heading={services} className="bg-t-muted" /> : null),
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={2} />,
        stats: () => <BigStats ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} showSpecialties />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Plot", "File", "Investment advice", "Sell my plot", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
