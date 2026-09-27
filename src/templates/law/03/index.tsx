/**
 * law-03 "Family Counsel" (#1303)
 * Warm terracotta & cream for family law, inheritance and property disputes. Cream header
 * with serif logo and terracotta CTA, portrait hero with a "confidential first consultation"
 * badge, practice areas with plain-language descriptions, prominent FAQ, warm circle team.
 * Rounded, readable.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, Lock, Phone } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
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

const PRACTICE_SUBJECTS = ["Family", "Inheritance", "Property", "Civil", "Criminal", "Other"];

/* ---------- Layout: cream header, serif logo, terracotta CTA ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader ctx={ctx} variant="light" className="[&>div>a>span]:font-semibold [&>div>a>span]:text-t-primary" />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="light" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: portrait photo, warm headline, confidential badge ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const [first, ...rest] = h.badges ?? [];
  return (
    <section className="overflow-hidden bg-t-muted">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up order-2 lg:order-1">
          {first ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-xs font-bold text-t-accent-fg">
              <span className="[&_svg]:size-4">
                <Icon name={first.icon || "Lock"} />
              </span>
              {first.text}
            </span>
          ) : null}
          {t(h.eyebrow, lang) ? <span className="mt-5 block text-sm font-semibold text-t-primary">{t(h.eyebrow, lang)}</span> : null}
          <h1 className="font-heading mt-3 text-4xl font-semibold leading-[1.12] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-ghost text-t-fg" />
          </div>
          {rest.length ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {rest.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-t-muted-fg">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
          <div className="absolute -end-4 -top-4 h-full w-full rounded-[2rem] bg-t-accent/60" aria-hidden="true" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover" fallback={<Heart className="size-16 opacity-30" />} />
          {ctx.settings.contact.phone ? (
            <a href={`tel:${ctx.settings.contact.phone}`} className="absolute -bottom-5 start-6 flex items-center gap-3 rounded-full bg-t-card px-5 py-3 text-sm shadow-lg ring-1 ring-t-border">
              <span className="flex size-9 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
                <Phone className="size-4" />
              </span>
              <span>
                <span className="block text-xs text-t-muted-fg">{t(ui.callNow, lang)}</span>
                <span className="font-semibold text-t-fg" dir="ltr">
                  {ctx.settings.contact.phone}
                </span>
              </span>
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: practice areas in plain language ---------- */
async function PlainPracticeAreas({ ctx }: TemplatePageProps) {
  const d = sectionData<HeadingData>(ctx, practiceAreasSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: 8 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="practice-areas" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ul className="grid gap-5 sm:grid-cols-2">
          {rows.map((s) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            return (
              <li key={s.id}>
                <Link href={`/services/${s.slug}`} className="t-card group flex h-full gap-5 rounded-[1.25rem] p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-t-accent text-t-accent-fg [&_svg]:size-6">
                    <Icon name={s.icon ?? undefined} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-heading block text-xl font-semibold text-t-fg group-hover:text-t-primary">{name}</span>
                    {summary ? <span className="mt-2 block text-base leading-7 text-t-muted-fg">{summary}</span> : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-t-primary">
                      {t(ui.readMore, lang)} <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
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

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        practiceAreas: () => <PlainPracticeAreas ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={3} className="bg-t-muted" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={2} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={2} />,
        faq: () => (
          <section id="faq" className="py-16 sm:py-20">
            <Container>
              <div className="rounded-[2rem] bg-t-muted px-6 py-12 sm:px-12">
                <FaqBlock ctx={ctx} variant="two-column" bare className="[&_.t-card]:rounded-[1rem]" />
              </div>
            </Container>
          </section>
        ),
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => (
          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex justify-center" aria-hidden="true">
              <span className="-mt-3 inline-flex items-center gap-1.5 rounded-full bg-t-accent px-3 py-1 text-[11px] font-bold text-t-accent-fg">
                <Lock className="size-3" /> {ctx.lang === "ur" ? "خفیہ" : "Confidential"}
              </span>
            </div>
            <ContactBlock ctx={ctx} layout="split" formKey="consultation" subjectOptions={PRACTICE_SUBJECTS} className="border-t border-t-border" />
          </div>
        ),
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
