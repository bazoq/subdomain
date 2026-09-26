/**
 * recruiting-06 "Skyline Careers" (#706)
 * Dark premium executive search: black header with gold serif logo, typographic hero with a
 * gold rule and a single "Confidential enquiry" CTA, jobs as understated list rows,
 * prominent consultants (team) section. Square corners, generous margins, gold hairlines.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { ctaSection, heroSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  FaqBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { jobPlace, jobSalary, recruitingStrings as rs } from "@/modules/recruiting/ui";
import { getFeaturedJobs } from "@/modules/recruiting/queries";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">
    <span className="h-px w-10 bg-t-primary" aria-hidden="true" /> {children}
  </p>
);

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader ctx={ctx} variant="dark" className="border-b border-t-border [&_.font-heading]:text-t-primary [&_nav_a]:tracking-wide" cta={{ label: { en: "Request staff", ur: "عملہ طلب کریں" }, href: "/employers" }} />
      <div className="flex-1">{children}</div>
      <div className="h-px w-full bg-t-primary/60" aria-hidden="true" />
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: typographic, gold rule, single CTA ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative bg-t-bg">
      <Container className="py-24 lg:py-40">
        <div className="mx-auto max-w-4xl">
          {h.eyebrow ? <Eyebrow>{h.eyebrow}</Eyebrow> : null}
          <h1 className="font-heading mt-8 text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">{t(h.title, lang)}</h1>
          <div className="mt-10 h-px w-32 bg-t-primary" aria-hidden="true" />
          <p className="mt-8 max-w-2xl text-lg leading-8 text-t-muted-fg lg:text-xl">{t(h.subtitle, lang)}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <SmartLink href={h.primaryCta?.href || "/contact"} ctx={ctx} className="t-btn t-btn-outline border-t-primary px-8 py-4 text-t-primary hover:bg-t-primary hover:text-t-primary-fg">
              <Lock className="size-4" /> {lang === "ur" ? "خفیہ رابطہ" : "Confidential enquiry"}
            </SmartLink>
            {h.badges?.length ? (
              <ul className="flex flex-wrap gap-6 text-sm text-t-muted-fg">
                {h.badges.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-t-primary">
                    <Icon name={b.icon} /> {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Container>
      {h.image ? <Img src={h.image} alt="" className="h-72 w-full object-cover opacity-60 grayscale lg:h-96" /> : null}
    </section>
  );
}

/* ---------- Signature: jobs as understated list rows ---------- */
async function JobRows({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredJobsSection);
  if (!d) return null;
  const jobs = await getFeaturedJobs(ctx.tenant.id, d.count || 6);
  if (!jobs.length) return null;
  const lang = ctx.lang;
  return (
    <section id="jobs" className="py-20 lg:py-28">
      <Container>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            {d.eyebrow ? <Eyebrow>{d.eyebrow}</Eyebrow> : null}
            <h2 className="font-heading mt-4 text-4xl font-medium tracking-tight sm:text-5xl">{t(d.title, lang)}</h2>
          </div>
          <CtaButton value={d.cta} ctx={ctx} className="text-sm font-semibold uppercase tracking-[0.2em] text-t-primary hover:underline" />
        </div>
        <ul className="border-t border-t-primary/40">
          {jobs.map((job) => (
            <li key={job.id} className="border-b border-t-border">
              <Link href={`/jobs/${job.slug}`} className="group grid items-center gap-2 py-6 transition hover:bg-t-muted sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:px-4">
                <div>
                  <h3 className="font-heading text-xl font-medium group-hover:text-t-primary sm:text-2xl">{t(job.title as LocalizedString, lang)}</h3>
                  <p className="mt-1 text-sm text-t-muted-fg">
                    {job.company ? `${job.company} · ` : ""}
                    {jobPlace(job)} · {job.type}
                  </p>
                </div>
                <span className="text-sm text-t-muted-fg sm:text-end">{jobSalary(job) ?? t(rs.salaryNegotiable, lang)}</span>
                <ArrowUpRight className="size-5 text-t-primary opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="industries" className="border-y border-t-border bg-t-muted py-20 lg:py-28">
      <Container>
        {d.eyebrow ? <Eyebrow>{d.eyebrow}</Eyebrow> : null}
        <h2 className="font-heading mt-4 max-w-2xl text-4xl font-medium tracking-tight sm:text-5xl">{t(d.title, ctx.lang)}</h2>
        <ol className="mt-12 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="border-t border-t-primary/30">
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="group flex items-baseline gap-4 py-5">
                <span className="font-heading text-sm text-t-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-heading text-xl font-medium transition group-hover:text-t-primary">{t(it.title, ctx.lang)}</span>
              </SmartLink>
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
    <section id="employers" className="py-20 lg:py-28">
      <Container>
        <div className="grid border border-t-primary lg:grid-cols-2">
          <div className="p-10 lg:p-16">
            <Eyebrow>{ctx.lang === "ur" ? "آجروں کے لیے" : "For employers"}</Eyebrow>
            <h2 className="font-heading mt-6 text-3xl font-medium sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-6 max-w-lg leading-8 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
            <div className="mt-10">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-8" />
            </div>
          </div>
          {d.image ? <Img src={d.image} alt="" className="min-h-64 w-full object-cover grayscale" /> : <div className="hidden border-s border-t-primary bg-t-muted lg:block" />}
        </div>
      </Container>
    </section>
  );
}

function QuietCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, ctaSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="cta" className="border-y border-t-primary/60 bg-t-dark py-20 text-center text-t-dark-fg">
      <Container>
        <h2 className="font-heading mx-auto max-w-3xl text-3xl font-medium sm:text-5xl">{title}</h2>
        {t(d.text, ctx.lang) ? <p className="mx-auto mt-6 max-w-xl text-t-dark-fg/70">{t(d.text, ctx.lang)}</p> : null}
        <div className="mt-10">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-8" />
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
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-bg [&_dd]:font-medium" />,
        featuredJobs: () => <JobRows ctx={ctx} />,
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="list" className="py-20 lg:py-28" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="border-y border-t-border bg-t-muted py-20 lg:py-28" />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="py-20 lg:py-28 [&_img]:grayscale [&_img]:rounded-none" />,
        team: () => <TeamBlock ctx={ctx} variant="wide" take={6} className="border-y border-t-border bg-t-muted py-20 lg:py-28" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="py-20 lg:py-28" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border py-20 lg:py-28" />,
        cta: () => <QuietCta ctx={ctx} />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" className="py-20 lg:py-28" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
