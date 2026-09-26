/**
 * printing-02 "Paper & Ink" (#202)
 * Kraft letterpress press for wedding cards, stationery and premium packaging: paper-toned
 * surfaces, square corners and Playfair headings. Thin uppercase nav with an outlined quote
 * button, a hero set in a double-ruled "pressed plate" frame, services as embossed
 * letterpress cards with a From-Rs footer, and the portfolio framed as the centrepiece.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Stamp } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { portfolioSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
import { HowItWorks } from "@/modules/printing/ui";

type ServicesHeading = HeadingData & { count?: number };

const PRINT_SUBJECTS = ["Wedding cards", "Invitations", "Packaging & boxes", "Letterheads & stationery", "Business cards", "Labels & tags", "Other"];

/** Letterpress plate: hairline border with an offset outer rule (pure CSS emboss). */
const EMBOSS = "border border-t-border bg-t-bg outline outline-1 outline-offset-4 outline-t-border";

function quoteLink(ctx: SiteContext): LinkData {
  const hero = ctx.sections.hero?.data as { primaryCta?: LinkData } | undefined;
  const label = t(hero?.primaryCta?.label, ctx.lang);
  return { label: label && hero?.primaryCta ? hero.primaryCta.label : ui.getQuote, href: "/quote" };
}

/* ---------- Layout: kraft header, serif wordmark, thin nav ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const q = quoteLink(ctx);
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={null}
        className="border-b-0 [&>div>a>span]:text-xl [&>div>a>span]:font-bold [&>div>a>span]:tracking-[0.12em] [&_nav_a]:text-[0.7rem] [&_nav_a]:uppercase [&_nav_a]:tracking-[0.2em]"
        rightSlot={
          <Link href={q.href} className="t-btn t-btn-outline px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-t-fg sm:px-4">
            {t(q.label, ctx.lang)}
          </Link>
        }
      />
      <div className="border-b border-t-border" aria-hidden="true">
        <div className="mx-auto h-px max-w-[calc(100%-2rem)] bg-t-border" />
      </div>
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: pressed plate frame, serif headline, flat-lay beneath ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const primary: LinkData = { label: t(h.primaryCta?.label, lang) ? h.primaryCta.label : ui.getQuote, href: h.primaryCta?.href || "/quote" };
  return (
    <section className="bg-t-muted">
      <Container className="py-14 sm:py-20">
        <div className={cn("t-fade-up mx-auto max-w-3xl px-6 py-12 text-center sm:px-12 sm:py-16", EMBOSS)}>
          {h.eyebrow ? <span className="block text-[0.7rem] font-bold uppercase tracking-[0.3em] text-t-accent">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.1] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <span className="mx-auto mt-6 flex items-center justify-center gap-3 text-t-accent" aria-hidden="true">
            <span className="h-px w-12 bg-t-border" />
            <Stamp className="size-4" />
            <span className="h-px w-12 bg-t-border" />
          </span>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton value={primary} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-[0.15em]" />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-[0.15em] text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-t-border pt-6">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-t-muted-fg">
                  <span className="text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {h.image ? <Img src={h.image} alt="" className="mx-auto mt-12 aspect-[21/9] w-full max-w-5xl border border-t-border object-cover" /> : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: services as embossed letterpress cards ---------- */
async function LetterpressServices({ ctx }: TemplatePageProps) {
  const d = sectionData<ServicesHeading>(ctx, servicesSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: d.count ?? 8 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="print-services" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            const price = servicePriceLabel(s, lang);
            return (
              <li key={s.id}>
                <Link href={`/services/${s.slug}`} className={cn("group flex h-full flex-col items-center p-7 text-center transition hover:bg-t-muted", EMBOSS)}>
                  <span className="flex size-12 items-center justify-center border border-t-border text-t-accent [&_svg]:size-5">
                    <Icon name={s.icon ?? undefined} />
                  </span>
                  <h3 className="font-heading mt-5 text-xl font-bold text-t-fg group-hover:text-t-accent">{name}</h3>
                  {summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-t-muted-fg">{summary}</p> : null}
                  <span className="mt-auto flex w-full items-center justify-center gap-2 border-t border-t-border pt-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-t-accent">
                    {price || t(ui.viewDetails, lang)}
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Portfolio: the centrepiece, framed on kraft ---------- */
function FramedPortfolio({ ctx }: TemplatePageProps) {
  const d = sectionData<GalleryHeadingData>(ctx, portfolioSection);
  if (!d) return null;
  return (
    <section id="portfolio" className="bg-t-muted py-16 sm:py-24">
      <Container>
        <div className={cn("p-6 sm:p-10", EMBOSS)}>
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
          <GalleryBlock ctx={ctx} album={d.album || "portfolio"} variant="grid" columns={3} take={12} bare className="[&_img]:rounded-none" />
        </div>
      </Container>
    </section>
  );
}

function QuoteStrip({ ctx }: TemplatePageProps) {
  return (
    <section className="border-t border-t-border bg-t-bg py-8">
      <Container className="flex justify-center">
        <Link href="/quote" className="t-btn t-btn-primary uppercase tracking-[0.15em]">
          {t(ui.getQuote, ctx.lang)}
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
        services: () => <LetterpressServices ctx={ctx} />,
        process: () => <HowItWorks ctx={ctx} variant="timeline" className="bg-t-muted" />,
        portfolio: () => <FramedPortfolio ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-bg [&_dd]:font-heading" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        brands: () => <BrandsMarquee ctx={ctx} speed="slow" className="bg-t-bg" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="border-y border-t-border bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        contact: () => (
          <>
            <ContactBlock ctx={ctx} layout="stacked" formKey="contact" subjectOptions={PRINT_SUBJECTS} className="border-t border-t-border" />
            <QuoteStrip ctx={ctx} />
          </>
        ),
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
