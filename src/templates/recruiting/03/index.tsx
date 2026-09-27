/**
 * recruiting-03 "HireHub" (#703)
 * Modern startup, violet gradient: floating glass header, gradient hero with search bar and
 * floating job-card previews, rounded job cards with company avatars, gradient stat tiles.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Banknote, MapPin, Sparkles } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, statsSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
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
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { JobSearchBar, isNewJob, jobPlace, jobSalary, recruitingStrings as rs } from "@/modules/recruiting/ui";
import { getFeaturedJobs } from "@/modules/recruiting/queries";
import { GlassHeader } from "./header";

type JobRow = Awaited<ReturnType<typeof getFeaturedJobs>>[number];

const Avatar = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-t-primary to-t-accent font-heading text-lg font-bold text-t-primary-fg", className)} aria-hidden="true">
    {(name || "?").charAt(0).toUpperCase()}
  </span>
);

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <GlassHeader ctx={ctx} cta={{ label: ctx.lang === "ur" ? "اپنا سی وی جمع کریں" : "Submit your CV", href: "/jobs" }} />
      <main id="main" className="flex-1 pt-24">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" className="rounded-t-[2.5rem]" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: gradient + search + floating job cards ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const preview = await getFeaturedJobs(ctx.tenant.id, 3);
  return (
    <section className="relative -mt-24 overflow-hidden bg-gradient-to-br from-t-secondary via-t-primary to-t-secondary pt-24 text-t-primary-fg">
      <div className="pointer-events-none absolute -top-24 -start-24 size-96 rounded-full bg-t-accent/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 end-0 size-[28rem] rounded-full bg-t-primary/60 blur-3xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-t-primary-fg/20 bg-t-primary-fg/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 text-t-accent" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-primary-fg/80">{t(h.subtitle, lang)}</p>
          <JobSearchBar ctx={ctx} className="mt-8 rounded-3xl text-t-fg [&_.t-btn]:rounded-2xl [&_.t-input]:rounded-2xl" />
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary-fg" />
          </div>
        </div>
        <div className="relative hidden min-h-[26rem] lg:block">
          {preview.length ? (
            preview.map((job, i) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className={cn(
                  "t-fade-up absolute w-80 rounded-3xl bg-t-card p-5 text-t-fg shadow-2xl ring-1 ring-t-fg/5 transition hover:-translate-y-1",
                  i === 0 && "top-0 end-8 rotate-2",
                  i === 1 && "top-36 start-0 -rotate-2",
                  i === 2 && "bottom-0 end-0 rotate-1",
                )}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={job.company || t(job.title as LocalizedString, lang)} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t(job.title as LocalizedString, lang)}</p>
                    <p className="truncate text-xs text-t-muted-fg">{job.company || jobPlace(job)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{job.type}</span>
                  <span className="rounded-full bg-t-muted px-2 py-0.5 text-t-muted-fg">{jobPlace(job)}</span>
                </div>
              </Link>
            ))
          ) : (
            <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl" />
          )}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: rounded job cards with avatars ---------- */
function JobTile({ job, ctx }: { job: JobRow; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const title = t(job.title as LocalizedString, lang);
  return (
    <article className="group relative flex flex-col gap-4 rounded-3xl border border-t-border bg-t-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-t-primary/10">
      <div className="flex items-start gap-4">
        <Avatar name={job.company || title} />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-bold leading-snug">
            <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 group-hover:text-t-primary">
              {title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-t-muted-fg">{job.company || jobPlace(job)}</p>
        </div>
        {job.isFeatured ? <span className="rounded-full bg-t-accent px-2 py-0.5 text-[11px] font-bold text-t-accent-fg">{t(ui.featured, lang)}</span> : isNewJob(job.createdAt) ? <span className="rounded-full bg-t-primary px-2 py-0.5 text-[11px] font-bold text-t-primary-fg">{t(ui.new, lang)}</span> : null}
      </div>
      <ul className="flex flex-wrap gap-2 text-xs font-medium">
        <li className="inline-flex items-center gap-1 rounded-full bg-t-muted px-3 py-1 text-t-muted-fg">
          <MapPin className="size-3.5" /> {jobPlace(job)}
        </li>
        <li className="rounded-full bg-t-muted px-3 py-1 text-t-muted-fg">{job.type}</li>
        {job.experience ? <li className="rounded-full bg-t-muted px-3 py-1 text-t-muted-fg">{job.experience}</li> : null}
      </ul>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-t-primary">
          <Banknote className="size-4" /> {jobSalary(job) ?? t(rs.salaryNegotiable, lang)}
        </span>
        <span className="rounded-full bg-t-primary/10 px-3 py-1 text-xs font-bold text-t-primary transition group-hover:bg-t-primary group-hover:text-t-primary-fg">{t(rs.applyNow, lang)}</span>
      </div>
    </article>
  );
}

async function JobsGrid({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredJobsSection);
  if (!d) return null;
  const jobs = await getFeaturedJobs(ctx.tenant.id, d.count || 6);
  if (!jobs.length) return null;
  return (
    <section id="jobs" className="t-fade-up py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobTile key={job.id} job={job} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: gradient stat tiles ---------- */
function GradientStats({ ctx }: TemplatePageProps) {
  const d = section(ctx, statsSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="stats" className="t-fade-up py-12 sm:py-16">
      <Container>
        <dl className={cn("grid gap-4", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className={cn("rounded-3xl p-6 text-t-primary-fg shadow-lg sm:p-8", i % 2 ? "bg-gradient-to-br from-t-secondary to-t-primary" : "bg-gradient-to-br from-t-primary to-t-accent")}>
              <dd className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{it.value}</dd>
              <dt className="mt-1 text-sm opacity-85">{t(it.label, ctx.lang)}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="industries" className="t-fade-up bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="flex flex-wrap justify-center gap-3">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="inline-flex items-center gap-2.5 rounded-full border border-t-border bg-t-card px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-t-primary hover:bg-t-primary hover:text-t-primary-fg [&_svg]:size-5 [&_svg]:text-t-primary hover:[&_svg]:text-t-primary-fg">
                <Icon name={it.icon} /> {t(it.title, ctx.lang)}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function EmployersCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, employersCtaSection);
  if (!d) return null;
  return (
    <section id="employers" className="t-fade-up py-12 sm:py-16">
      <Container>
        <div className="relative grid overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-t-primary to-t-secondary text-t-primary-fg lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 max-w-lg leading-7 text-t-primary-fg/80">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          {d.image ? <Img src={d.image} alt="" className="h-full min-h-56 w-full object-cover" /> : <div className="hidden bg-t-primary-fg/5 lg:block" />}
        </div>
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
        stats: () => <GradientStats ctx={ctx} />,
        featuredJobs: () => <JobsGrid ctx={ctx} />,
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="t-fade-up [&_.t-card]:rounded-3xl" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="t-fade-up bg-t-muted" />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="t-fade-up" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} className="t-fade-up bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" className="t-fade-up [&_.t-card]:rounded-3xl" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="t-fade-up bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="t-fade-up [&>div>div]:rounded-[2.5rem]" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" className="t-fade-up" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
