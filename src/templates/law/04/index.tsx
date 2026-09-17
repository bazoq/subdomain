/**
 * law-04 "Corporate Counsel" (#1304)
 * Slate & teal, data-forward layout for corporate, tax and compliance advisory. Slate header
 * with "Book advisory call", split hero with abstract office photo and a stats row, practice
 * areas as table-like cards, process as numbered compliance steps, features rendered as a
 * clients/credentials strip. Formal grid.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckSquare, Building2 } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { featuresSection, heroSection, processSection, statsSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getServices } from "@/modules/shared/queries";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  SiteFooter,
  SiteHeader,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { FeaturesData, HeadingData, ProcessData, StatsData } from "@/modules/shared/ui/section-types";

const PRACTICE_SUBJECTS = ["Corporate", "Tax", "Compliance", "Contracts", "Employment", "Other"];

/* ---------- Layout: slate header, teal-tinted logo, advisory CTA ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader ctx={ctx} variant="dark" cta={{ label: { en: "Book advisory call", ur: "مشاورتی کال بک کریں" }, href: "/consultation" }} className="[&>div>a>span]:text-t-accent" />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: split with photo + stats row ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const stats = sectionData<StatsData>(ctx, statsSection);
  return (
    <section className="border-b border-t-border bg-t-bg">
      <Container className="grid items-stretch gap-0 lg:grid-cols-2">
        <div className="t-fade-up flex flex-col justify-center py-16 lg:pe-16 lg:py-24">
          {h.eyebrow ? <span className="text-xs font-semibold uppercase tracking-[0.25em] text-t-primary">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          {stats?.items?.length ? (
            <dl className="mt-12 grid grid-cols-2 gap-px border border-t-border bg-t-border sm:grid-cols-4">
              {stats.items.slice(0, 4).map((s, i) => (
                <div key={i} className="bg-t-bg p-4">
                  <dd className="font-heading text-2xl font-semibold text-t-primary">{s.value}</dd>
                  <dt className="mt-1 text-xs text-t-muted-fg">{t(s.label, lang)}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="relative min-h-72 lg:min-h-0">
          <Img src={h.image} alt="" className="h-full w-full object-cover lg:absolute lg:inset-0" fallback={<Building2 className="size-16 opacity-30" />} />
          <div className="absolute inset-0 bg-gradient-to-tr from-t-secondary/70 via-t-secondary/10 to-transparent" aria-hidden="true" />
          {h.badges?.length ? (
            <ul className="absolute bottom-6 start-6 end-6 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 bg-t-bg/95 px-3 py-2 text-xs font-semibold text-t-fg backdrop-blur">
                  <span className="text-t-primary [&_svg]:size-4">
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

/* ---------- Signature: practice areas as table-like cards ---------- */
async function TablePracticeAreas({ ctx }: TemplatePageProps) {
  const d = sectionData<HeadingData>(ctx, practiceAreasSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: 9 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="practice-areas" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={lang} />
        <div className="grid gap-px border border-t-border bg-t-border sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s, i) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            return (
              <Link key={s.id} href={`/services/${s.slug}`} className="group flex flex-col bg-t-card p-6 transition hover:bg-t-muted">
                <div className="flex items-center justify-between border-b border-t-border pb-3 text-xs font-semibold uppercase tracking-wider text-t-muted-fg">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={s.icon ?? undefined} />
                  </span>
                </div>
                <h3 className="font-heading mt-4 text-lg font-semibold text-t-fg group-hover:text-t-primary">{name}</h3>
                {summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-t-muted-fg">{summary}</p> : null}
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-t-primary">
                  {t(ui.viewDetails, lang)} <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: process as compliance steps ---------- */
function ComplianceSteps({ ctx }: TemplatePageProps) {
  const d = sectionData<ProcessData>(ctx, processSection);
  if (!d || !d.steps?.length) return null;
  return (
    <section id="process" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={ctx.lang} light />
        <ol className={cn("grid gap-px bg-white/10", d.steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          {d.steps.map((s, i) => (
            <li key={i} className="bg-t-dark p-6">
              <div className="flex items-center justify-between">
                <span className="font-heading text-3xl font-semibold text-t-accent">{String(i + 1).padStart(2, "0")}</span>
                <CheckSquare className="size-5 text-t-accent/70" aria-hidden="true" />
              </div>
              <h3 className="font-heading mt-4 flex items-center gap-2 text-lg font-semibold">
                <Icon name={s.icon} className="size-5 text-t-accent" /> {t(s.title, ctx.lang)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-t-dark-fg/70">{t(s.text, ctx.lang)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Signature: features as a clients / credentials strip ---------- */
function CredentialsStrip({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturesData>(ctx, featuresSection);
  if (!d || !d.items?.length) return null;
  const title = t(d.title, ctx.lang);
  return (
    <section id="features" className="border-y border-t-border bg-t-muted py-10">
      <Container>
        {title ? <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-t-muted-fg">{title}</p> : null}
        <ul className="grid grid-cols-2 gap-px bg-t-border ring-1 ring-t-border lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 bg-t-bg px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center bg-t-primary/10 text-t-primary [&_svg]:size-5">
                <Icon name={it.icon} />
              </span>
              <span className="min-w-0">
                <span className="font-heading block truncate text-sm font-semibold text-t-fg">{t(it.title, ctx.lang)}</span>
                <span className="line-clamp-1 block text-xs text-t-muted-fg">{t(it.text, ctx.lang)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: stats as data cards ---------- */
function DataStats({ ctx }: TemplatePageProps) {
  const d = sectionData<StatsData>(ctx, statsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="stats" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <dl className={cn("grid gap-5", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className="border-s-4 border-t-primary bg-t-card p-6 shadow-sm">
              <dd className="font-heading text-4xl font-semibold tracking-tight text-t-fg">{it.value}</dd>
              <dt className="mt-2 text-sm text-t-muted-fg">{t(it.label, ctx.lang)}</dt>
            </div>
          ))}
        </dl>
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
        practiceAreas: () => <TablePracticeAreas ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        stats: () => <DataStats ctx={ctx} />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={4} showSpecialties />,
        process: () => <ComplianceSteps ctx={ctx} />,
        features: () => <CredentialsStrip ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="consultation" subjectOptions={PRACTICE_SUBJECTS} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
