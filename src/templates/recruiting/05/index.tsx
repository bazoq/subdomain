/**
 * recruiting-05 "MedStaff" (#705)
 * Healthcare recruitment, clean teal: white header with teal cross logo mark and
 * "Register as nurse" CTA, split hero with staff photo and licence badges, specialities
 * chips instead of an industries grid, licensing steps as a horizontal stepper.
 */
import * as React from "react";
import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, processSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  ServicesBlock,
  SiteFooter,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedJobs } from "@/modules/recruiting/ui";
import { ClinicHeader } from "./header";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <ClinicHeader ctx={ctx} cta={{ label: ctx.lang === "ur" ? "نرس کے طور پر رجسٹر کریں" : "Register as nurse", href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="light" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: split with staff photo + licence badges ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <div className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-t-primary/10" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-t-primary">
              <HeartPulse className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-3" aria-label={lang === "ur" ? "لائسنس" : "Licences"}>
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-[var(--t-radius)] border border-t-border bg-t-card px-4 py-2.5 text-sm font-semibold shadow-sm">
                  <span className="text-t-primary [&_svg]:size-5">
                    <Icon name={b.icon || "ShieldCheck"} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<Stethoscope className="size-16 opacity-30" />} />
          <div className="absolute -bottom-5 -start-5 hidden size-24 items-center justify-center rounded-[var(--t-radius)] bg-t-primary text-t-primary-fg shadow-lg sm:flex" aria-hidden="true">
            <span className="relative block size-12">
              <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-sm bg-t-primary-fg" />
              <span className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 rounded-sm bg-t-primary-fg" />
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: specialities chips ---------- */
function Specialities({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="specialities" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="inline-flex items-center gap-2.5 rounded-full border-2 border-t-primary/20 bg-t-muted px-5 py-3 text-base font-semibold text-t-fg transition hover:border-t-primary hover:bg-t-primary hover:text-t-primary-fg [&_svg]:size-5 [&_svg]:text-t-primary hover:[&_svg]:text-t-primary-fg">
                <Icon name={it.icon} /> {t(it.title, ctx.lang)}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: licensing stepper ---------- */
function LicensingSteps({ ctx }: TemplatePageProps) {
  const d = section(ctx, processSection);
  if (!d || !d.steps.length) return null;
  return (
    <section id="process" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ol className={cn("relative grid gap-8", d.steps.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
          <div className="absolute inset-x-[12.5%] top-6 hidden h-0.5 bg-t-primary/25 md:block" aria-hidden="true" />
          {d.steps.map((s, i) => (
            <li key={i} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-t-primary font-heading text-lg font-bold text-t-primary-fg ring-8 ring-t-muted">{i + 1}</span>
              <span className="mt-5 flex size-14 items-center justify-center rounded-[var(--t-radius)] bg-t-card text-t-primary shadow-sm [&_svg]:size-7">
                <Icon name={s.icon} />
              </span>
              <h3 className="font-heading mt-4 text-lg font-bold">{t(s.title, ctx.lang)}</h3>
              <p className="mt-1.5 text-sm leading-6 text-t-muted-fg">{t(s.text, ctx.lang)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function EmployersCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, employersCtaSection);
  if (!d) return null;
  return (
    <section id="employers" className="py-12 sm:py-16">
      <Container>
        <div className="grid items-center gap-8 rounded-[var(--t-radius)] bg-t-primary p-8 text-t-primary-fg sm:p-12 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-5">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-[var(--t-radius)] bg-t-primary-fg/15 sm:flex">
              <ShieldCheck className="size-7" />
            </span>
            <div>
              <h2 className="font-heading text-3xl font-bold">{t(d.title, ctx.lang)}</h2>
              <p className="mt-3 max-w-2xl leading-7 opacity-85">{t(d.text, ctx.lang)}</p>
            </div>
          </div>
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent shrink-0" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        {d.image ? <Img src={d.image} alt="" className="mt-6 aspect-[21/9] w-full rounded-[var(--t-radius)] object-cover" /> : null}
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const jobs = section(ctx, featuredJobsSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-b border-t-border bg-t-bg" />,
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={jobs.eyebrow} title={jobs.title} /> : null),
        industries: () => <Specialities ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="bg-t-muted" />,
        process: () => <LicensingSteps ctx={ctx} />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
