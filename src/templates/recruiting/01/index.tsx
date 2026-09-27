/**
 * recruiting-01 "TalentBridge" (#701)
 * Corporate navy, job-search first: navy top strip with licence + phone, navy gradient hero
 * with JobSearchBar card, stats row beneath, industries icon-tile grid, employers split banner.
 */
import * as React from "react";
import { ArrowRight, Briefcase, Building2, Mail, Phone } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedJobs, JobSearchBar } from "@/modules/recruiting/ui";

/* ---------- Layout: navy top strip + white header ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const h = section(ctx, heroSection);
  const c = ctx.settings.contact;
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <div className="bg-t-secondary text-t-secondary-fg">
        <Container className="flex h-9 items-center justify-between gap-4 text-xs">
          <ul className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
            {h?.badges?.slice(0, 2).map((b, i) => (
              <li key={i} className="flex items-center gap-1.5 opacity-90 [&_svg]:size-3.5">
                <Icon name={b.icon} /> {b.text}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 font-semibold hover:text-t-accent">
                <Phone className="size-3.5" /> <span dir="ltr">{c.phone}</span>
              </a>
            ) : null}
            {c.email ? (
              <a href={`mailto:${c.email}`} className="hidden items-center gap-1.5 hover:text-t-accent sm:flex">
                <Mail className="size-3.5" /> {c.email}
              </a>
            ) : null}
          </div>
        </Container>
      </div>
      <SiteHeader ctx={ctx} variant="light" cta={{ label: { en: "Submit your CV", ur: "اپنا سی وی جمع کریں" }, href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: navy gradient + search card ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-t-secondary via-t-primary to-t-secondary text-t-primary-fg">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-flex items-center rounded-[var(--t-radius)] bg-t-primary-fg/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-accent">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-primary-fg/80">{t(h.subtitle, lang)}</p>
          <div className="mt-8">
            <JobSearchBar ctx={ctx} className="text-t-fg" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary-fg" />
          </div>
        </div>
        <div className="relative hidden lg:block">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-2xl ring-1 ring-t-primary-fg/10" fallback={<Briefcase className="size-16 opacity-30" />} />
          {h.badges?.length ? (
            <ul className="absolute -bottom-6 start-6 flex gap-3">
              {h.badges.slice(0, 2).map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-[var(--t-radius)] bg-t-card px-4 py-3 text-sm font-semibold text-t-fg shadow-xl">
                  <span className="flex size-8 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-4">
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

/* ---------- Signature: industries icon tiles ---------- */
function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="industries" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="t-card group flex h-full flex-col items-center gap-3 p-6 text-center transition hover:-translate-y-0.5 hover:border-t-primary hover:shadow-lg">
                <span className="flex size-14 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary transition group-hover:bg-t-primary group-hover:text-t-primary-fg [&_svg]:size-7">
                  <Icon name={it.icon} />
                </span>
                <span className="font-heading text-sm font-bold leading-snug">{t(it.title, ctx.lang)}</span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: employers split banner ---------- */
function EmployersCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, employersCtaSection);
  if (!d) return null;
  return (
    <section id="employers" className="py-12 sm:py-16">
      <Container>
        <div className="grid overflow-hidden rounded-[var(--t-radius)] bg-t-secondary text-t-secondary-fg shadow-xl lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-t-accent">
              <Building2 className="size-4" /> {ctx.lang === "ur" ? "آجروں کے لیے" : "For employers"}
            </span>
            <h2 className="font-heading mt-3 text-3xl font-bold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 max-w-lg text-base leading-7 opacity-80">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="min-h-56 w-full object-cover lg:h-full" fallback={<Building2 className="size-14 opacity-30" />} />
        </div>
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
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={jobs.eyebrow} title={jobs.title} className="bg-t-muted" /> : null),
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="bg-t-muted" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
