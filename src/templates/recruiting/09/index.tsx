/**
 * recruiting-09 "TechTalent" (#709)
 * IT recruiting, dark-blue & electric green with monospace accents: terminal-style header,
 * code-window hero with CSS typed headline and search bar, jobs as cards with mono chips,
 * process as a pipeline. Dark tech, green accents, mono labels.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Terminal } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { ctaSection, heroSection, processSection, statsSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, ContactBlock, FaqBlock, ServicesBlock, SiteFooter, TeamBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { JobSearchBar, isNewJob, jobPlace, jobSalary, recruitingStrings as rs } from "@/modules/recruiting/ui";
import { getFeaturedJobs } from "@/modules/recruiting/queries";
import { TerminalHeader } from "./header";

type JobRow = Awaited<ReturnType<typeof getFeaturedJobs>>[number];

const TYPING_CSS = `
.tt-type{display:inline-block;max-width:100%;overflow:hidden;white-space:nowrap;vertical-align:bottom;border-inline-end:.12em solid var(--t-primary);animation:tt-typing 2.4s steps(42,end) both,tt-blink .8s step-end infinite}
@keyframes tt-typing{from{width:0}to{width:100%}}
@keyframes tt-blink{50%{border-color:transparent}}
@media (max-width:767px),(prefers-reduced-motion:reduce){.tt-type{white-space:normal;animation:none;border-inline-end:0}}
`;

/** Mono label like "// heading" used above every section. */
function MonoHeading({ eyebrow, title, subtitle, lang, className }: { eyebrow?: string; title?: LocalizedString | string; subtitle?: LocalizedString | string; lang: "en" | "ur"; className?: string }) {
  const ttl = t(title, lang);
  if (!ttl && !eyebrow) return null;
  return (
    <div className={cn("mb-10 max-w-2xl", className)}>
      {eyebrow ? <p className="font-mono text-sm text-t-primary">{`// ${eyebrow.toLowerCase()}`}</p> : null}
      {ttl ? <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{ttl}</h2> : null}
      {t(subtitle, lang) ? <p className="mt-3 text-t-muted-fg">{t(subtitle, lang)}</p> : null}
    </div>
  );
}

const Chip = ({ children }: { children: React.ReactNode }) => <span className="rounded-[var(--t-radius)] border border-t-border bg-t-muted px-2 py-0.5 font-mono text-[11px] text-t-primary">{children}</span>;

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="primary" className="font-mono text-sm" />
      <TerminalHeader ctx={ctx} cta={{ label: ctx.lang === "ur" ? "سی وی جمع کریں" : "submit_cv()", href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: code window with typed headline ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <style>{TYPING_CSS}</style>
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--t-primary)_1px,transparent_1px),linear-gradient(90deg,var(--t-primary)_1px,transparent_1px)] [background-size:40px_40px]" aria-hidden="true" />
      <Container className="relative py-16 lg:py-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card shadow-2xl shadow-t-primary/10">
          <div className="flex items-center gap-2 border-b border-t-border bg-t-muted px-4 py-3">
            <span className="size-3 rounded-full bg-t-primary/60" aria-hidden="true" />
            <span className="size-3 rounded-full bg-t-accent/60" aria-hidden="true" />
            <span className="size-3 rounded-full bg-t-muted-fg/40" aria-hidden="true" />
            <span className="ms-3 font-mono text-xs text-t-muted-fg">{h.eyebrow ? h.eyebrow.toLowerCase().replace(/\s+/g, "-") : "hero"}.tsx</span>
          </div>
          <div className="p-6 sm:p-10">
            <p className="font-mono text-sm text-t-muted-fg">
              <span className="text-t-accent">const</span> <span className="text-t-primary">nextRole</span> = {"{"}
            </p>
            <h1 className="font-heading my-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              <span className="tt-type">{t(h.title, lang)}</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
            <p className="mt-4 font-mono text-sm text-t-muted-fg">{"}"};</p>
            <div className="mt-8 flex items-center gap-3">
              <span className="hidden font-mono text-t-primary sm:block">$</span>
              <JobSearchBar ctx={ctx} variant="plain" className="max-w-none [&_.t-input]:font-mono [&_.t-input]:text-sm" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary font-mono" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline font-mono text-t-accent" />
              {h.badges?.length ? (
                <ul className="flex flex-wrap gap-2 sm:ms-auto">
                  {h.badges.map((b, i) => (
                    <li key={i} className="flex items-center gap-1.5 font-mono text-xs text-t-muted-fg [&_svg]:size-3.5 [&_svg]:text-t-primary">
                      <Icon name={b.icon} /> {b.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
        {h.image ? <Img src={h.image} alt="" className="mx-auto mt-10 max-w-4xl rounded-[var(--t-radius)] border border-t-border object-cover" /> : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: job cards with mono chips ---------- */
function JobCardMono({ job, ctx }: { job: JobRow; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const title = t(job.title as LocalizedString, lang);
  return (
    <article className="group relative flex flex-col gap-3 rounded-[var(--t-radius)] border border-t-border bg-t-card p-5 transition hover:border-t-primary hover:shadow-lg hover:shadow-t-primary/10">
      <div className="flex items-center justify-between font-mono text-xs text-t-muted-fg">
        <span>{job.company ? `@${job.company.replace(/\s+/g, "-").toLowerCase()}` : jobPlace(job)}</span>
        {job.isFeatured ? <span className="text-t-accent">★ {t(ui.featured, lang).toLowerCase()}</span> : isNewJob(job.createdAt) ? <span className="text-t-primary">+ {t(ui.new, lang).toLowerCase()}</span> : null}
      </div>
      <h3 className="font-heading text-lg font-bold leading-snug">
        <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 group-hover:text-t-primary">
          {title}
        </Link>
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {job.department ? <li><Chip>{job.department}</Chip></li> : null}
        <li><Chip>{job.type}</Chip></li>
        {job.experience ? <li><Chip>{job.experience}</Chip></li> : null}
        <li><Chip>{jobPlace(job)}</Chip></li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-2 font-mono text-sm">
        <span className="text-t-primary">{jobSalary(job) ?? t(rs.salaryNegotiable, lang)}</span>
        <span className="text-t-muted-fg transition group-hover:text-t-fg">{t(rs.applyNow, lang).toLowerCase()} →</span>
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
    <section id="jobs" className="py-16 sm:py-20">
      <Container>
        <MonoHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCardMono key={job.id} job={job} ctx={ctx} />
          ))}
        </div>
        <div className="mt-8">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline font-mono text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: process as pipeline ---------- */
function Pipeline({ ctx }: TemplatePageProps) {
  const d = section(ctx, processSection);
  if (!d || !d.steps.length) return null;
  return (
    <section id="process" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <MonoHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ol className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
          {d.steps.map((s, i) => (
            <li key={i} className="flex flex-1 items-stretch">
              <div className="flex-1 rounded-[var(--t-radius)] border border-t-border bg-t-card p-6">
                <p className="font-mono text-xs text-t-primary">
                  [{i + 1}/{d.steps.length}] <span className="text-t-muted-fg">stage</span>
                </p>
                <span className="mt-4 flex size-11 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-5">
                  <Icon name={s.icon} />
                </span>
                <h3 className="font-heading mt-4 text-lg font-bold">{t(s.title, ctx.lang)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-t-muted-fg">{t(s.text, ctx.lang)}</p>
              </div>
              {i < d.steps.length - 1 ? (
                <span className="flex items-center justify-center self-center px-1 text-t-primary lg:px-2" aria-hidden="true">
                  <ChevronRight className="size-6 rotate-90 lg:rotate-0 rtl:lg:rotate-180" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function MonoStats({ ctx }: TemplatePageProps) {
  const d = section(ctx, statsSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="stats" className="border-y border-t-border">
      <Container className="px-0 sm:px-0 lg:px-0">
        <dl className={cn("grid divide-y divide-t-border sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse", d.items.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className="px-6 py-8">
              <dd className="font-mono text-3xl font-bold text-t-primary sm:text-4xl">{it.value}</dd>
              <dt className="mt-1 font-mono text-xs uppercase tracking-wider text-t-muted-fg">{t(it.label, ctx.lang)}</dt>
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
    <section id="industries" className="py-16 sm:py-20">
      <Container>
        <MonoHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="group flex h-full flex-col gap-3 rounded-[var(--t-radius)] border border-t-border bg-t-card p-4 transition hover:border-t-primary">
                <span className="text-t-primary [&_svg]:size-6">
                  <Icon name={it.icon} />
                </span>
                <span className="font-mono text-xs text-t-muted-fg group-hover:text-t-primary">./{t(it.title, ctx.lang).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")}</span>
                <span className="font-heading text-sm font-bold">{t(it.title, ctx.lang)}</span>
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
    <section id="employers" className="py-12 sm:py-16">
      <Container>
        <div className="grid overflow-hidden rounded-[var(--t-radius)] border border-t-primary/40 bg-t-card lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <p className="flex items-center gap-2 font-mono text-sm text-t-primary">
              <Terminal className="size-4" /> {ctx.lang === "ur" ? "آجروں کے لیے" : "hire --remote --fast"}
            </p>
            <h2 className="font-heading mt-4 text-3xl font-bold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 max-w-lg leading-7 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary font-mono" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          {d.image ? <Img src={d.image} alt="" className="min-h-56 w-full object-cover" /> : <div className="hidden border-s border-t-border bg-t-muted lg:block" />}
        </div>
      </Container>
    </section>
  );
}

function CodeCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, ctaSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="cta" className="bg-t-primary py-16 text-t-primary-fg sm:py-20">
      <Container className="text-center">
        <p className="font-mono text-sm opacity-70">{"/* "}{ctx.lang === "ur" ? "ابھی شروع کریں" : "ready when you are"}{" */"}</p>
        <h2 className="font-heading mt-3 text-3xl font-bold sm:text-5xl">{title}</h2>
        {t(d.text, ctx.lang) ? <p className="mx-auto mt-4 max-w-2xl text-lg opacity-85">{t(d.text, ctx.lang)}</p> : null}
        <div className="mt-8">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn bg-t-dark font-mono text-t-dark-fg hover:bg-t-secondary hover:text-t-secondary-fg" />
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
        stats: () => <MonoStats ctx={ctx} />,
        featuredJobs: () => <JobsGrid ctx={ctx} />,
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="border-y border-t-border bg-t-muted [&_.t-eyebrow]:font-mono" />,
        process: () => <Pipeline ctx={ctx} />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="[&_.t-eyebrow]:font-mono" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} className="border-y border-t-border bg-t-muted [&_.t-eyebrow]:font-mono" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" className="[&_.t-eyebrow]:font-mono" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border bg-t-muted [&_.t-eyebrow]:font-mono" />,
        cta: () => <CodeCta ctx={ctx} />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" className="[&_.t-eyebrow]:font-mono" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
