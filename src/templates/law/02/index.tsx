/**
 * law-02 "Advocate Modern" (#1302)
 * Contemporary minimal black & white with one blue accent for boutique corporate practices.
 * Minimal header with wordmark and black CTA, typographic hero with a huge headline and a
 * blue accent line, practice areas as a numbered list, attorneys as wide cards.
 * Generous whitespace, small corners.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  ProcessBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData } from "@/modules/shared/ui/section-types";

const PRACTICE_SUBJECTS = ["Civil", "Criminal", "Family", "Property", "Corporate", "Other"];

/* ---------- Layout: minimal wordmark header, black CTA ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader ctx={ctx} variant="light" className="border-b-0 [&>div>a>span]:text-lg [&>div>a>span]:uppercase [&>div>a>span]:tracking-[0.2em] [&_nav_a]:text-xs [&_nav_a]:uppercase [&_nav_a]:tracking-wider" />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" showHours={false} />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: typographic, blue accent line ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg">
      <Container className="pb-16 pt-14 sm:pt-20 lg:pb-24 lg:pt-28">
        <div className="t-fade-up max-w-5xl">
          <span className="block h-1 w-16 bg-t-accent" aria-hidden="true" />
          {h.eyebrow ? <span className="mt-6 block text-xs font-semibold uppercase tracking-[0.3em] text-t-muted-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-4 text-5xl font-extrabold leading-[0.98] tracking-tight text-t-fg sm:text-6xl lg:text-8xl">{t(h.title, lang)}</h1>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowUpRight className="size-4 rtl:-scale-x-100" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
        </div>
        {h.badges?.length ? (
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-t-border pt-6">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-t-fg">
                <span className="text-t-accent [&_svg]:size-4">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
        {h.image ? <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="mt-12 aspect-[21/9] w-full rounded-[var(--t-radius)] object-cover grayscale" /> : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: practice areas as a numbered list ---------- */
async function NumberedPracticeAreas({ ctx }: TemplatePageProps) {
  const d = sectionData<HeadingData>(ctx, practiceAreasSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: 10 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="practice-areas" className="border-t border-t-border py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-3">
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={lang} className="mb-0 lg:sticky lg:top-28 lg:self-start" />
        <ol className="lg:col-span-2">
          {rows.map((s, i) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            return (
              <li key={s.id} className="border-t border-t-border last:border-b">
                <Link href={`/services/${s.slug}`} className="group grid gap-2 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-6">
                  <span className="font-heading text-sm font-bold text-t-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="font-heading block text-2xl font-bold text-t-fg transition group-hover:text-t-accent sm:text-3xl">{name}</span>
                    {summary ? <span className="mt-2 block max-w-xl text-sm leading-6 text-t-muted-fg">{summary}</span> : null}
                  </span>
                  <ArrowUpRight className="hidden size-6 text-t-muted-fg transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-t-accent sm:block rtl:-scale-x-100" />
                </Link>
              </li>
            );
          })}
        </ol>
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
        practiceAreas: () => <NumberedPracticeAreas ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-bg [&_dd]:text-5xl [&_dd]:font-extrabold [&_dd]:text-t-fg" />,
        team: () => <TeamBlock ctx={ctx} variant="wide" showSpecialties />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="border-t border-t-border" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="consultation" subjectOptions={PRACTICE_SUBJECTS} showHours={false} className="border-t border-t-border" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
