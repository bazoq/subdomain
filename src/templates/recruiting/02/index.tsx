/**
 * recruiting-02 "GulfGate" (#702)
 * Gulf-focused green & gold: skyline photo hero with gold serif headline and country chips,
 * featured jobs grouped by country with flags, gold-numbered process steps, gold hairlines.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Globe, MessageCircle } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, processSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { JobCard, jobsHref } from "@/modules/recruiting/ui";
import { getFeaturedJobs } from "@/modules/recruiting/queries";

const COUNTRIES: { name: string; ur: string; flag: string }[] = [
  { name: "Saudi Arabia", ur: "سعودی عرب", flag: "🇸🇦" },
  { name: "United Arab Emirates", ur: "متحدہ عرب امارات", flag: "🇦🇪" },
  { name: "Qatar", ur: "قطر", flag: "🇶🇦" },
  { name: "Oman", ur: "عمان", flag: "🇴🇲" },
];
const FLAGS: Record<string, string> = {
  "saudi arabia": "🇸🇦",
  ksa: "🇸🇦",
  "united arab emirates": "🇦🇪",
  uae: "🇦🇪",
  qatar: "🇶🇦",
  oman: "🇴🇲",
  kuwait: "🇰🇼",
  bahrain: "🇧🇭",
  pakistan: "🇵🇰",
  "united kingdom": "🇬🇧",
  uk: "🇬🇧",
  malaysia: "🇲🇾",
};
const flagFor = (country: string) => FLAGS[country.trim().toLowerCase()];

const GoldRule = ({ className }: { className?: string }) => <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-t-accent to-transparent", className)} aria-hidden="true" />;

/* ---------- Layout: green header, gold logotype, WhatsApp button ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        className="[&_.font-heading]:text-t-accent"
        cta={{ label: { en: "Submit your CV", ur: "اپنا سی وی جمع کریں" }, href: "/jobs" }}
        rightSlot={
          wa ? (
            <SmartLink href="whatsapp" ctx={ctx} className="inline-flex size-10 items-center justify-center rounded-[var(--t-radius)] border border-t-accent/50 text-t-accent hover:bg-white/10" aria-label={t(ui.whatsapp, ctx.lang)}>
              <MessageCircle className="size-5" />
            </SmartLink>
          ) : null
        }
      />
      <div className="h-px w-full bg-t-accent" aria-hidden="true" />
      <main id="main" className="flex-1">{children}</main>
      <div className="h-px w-full bg-t-accent" aria-hidden="true" />
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: skyline photo, gold serif headline, country chips ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? (
        <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="eager" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-t-dark via-t-dark/70 to-t-dark/30" aria-hidden="true" />
      <Container className="relative py-24 text-center lg:py-36">
        {h.eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.35em] text-t-accent">{h.eyebrow}</p> : null}
        <GoldRule className="mx-auto mt-4 max-w-xs" />
        <h1 className="font-heading mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.15] text-t-accent sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-t-dark-fg/80">{t(h.subtitle, lang)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-accent" />
        </div>
        <ul className="mt-12 flex flex-wrap justify-center gap-3" aria-label={lang === "ur" ? "ممالک" : "Countries"}>
          {COUNTRIES.map((c) => (
            <li key={c.name}>
              <Link href={jobsHref({ country: c.name })} className="inline-flex items-center gap-2 rounded-[var(--t-radius)] border border-t-accent/40 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-t-accent hover:bg-t-accent hover:text-t-accent-fg">
                <span aria-hidden="true">{c.flag}</span> {lang === "ur" ? c.ur : c.name}
              </Link>
            </li>
          ))}
        </ul>
        {h.badges?.length ? (
          <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-t-dark-fg/80">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-t-accent">
                <Icon name={b.icon} /> {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: featured jobs grouped by country ---------- */
async function JobsByCountry({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredJobsSection);
  if (!d) return null;
  const jobs = await getFeaturedJobs(ctx.tenant.id, d.count || 6);
  if (!jobs.length) return null;
  const groups = new Map<string, typeof jobs>();
  for (const j of jobs) {
    const k = j.country || "Pakistan";
    groups.set(k, [...(groups.get(k) ?? []), j]);
  }
  return (
    <section id="jobs" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <div className="space-y-12">
          {Array.from(groups.entries()).map(([country, list]) => (
            <div key={country}>
              <div className="mb-5 flex items-center gap-4">
                <h3 className="font-heading flex items-center gap-2 text-xl font-bold text-t-secondary">
                  {flagFor(country) ? <span aria-hidden="true">{flagFor(country)}</span> : <Globe className="size-5 text-t-accent" />}
                  {country}
                  <span className="rounded-[var(--t-radius)] bg-t-accent px-2 py-0.5 text-xs text-t-accent-fg">{list.length}</span>
                </h3>
                <div className="h-px flex-1 bg-t-accent/50" aria-hidden="true" />
                <Link href={jobsHref({ country })} className="text-sm font-semibold text-t-primary hover:underline">
                  {ctx.lang === "ur" ? "سب دیکھیں" : "View all"} →
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((job) => (
                  <JobCard key={job.id} job={job} ctx={ctx} className="border-t-accent/30 hover:border-t-accent" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: gold-numbered process ---------- */
function GoldProcess({ ctx }: TemplatePageProps) {
  const d = section(ctx, processSection);
  if (!d || !d.steps.length) return null;
  return (
    <section id="process" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} light />
        <ol className="grid gap-px overflow-hidden border border-t-accent/30 bg-t-accent/30 sm:grid-cols-2 lg:grid-cols-4">
          {d.steps.map((s, i) => (
            <li key={i} className="bg-t-dark p-8">
              <span className="font-heading block text-5xl font-bold leading-none text-t-accent">{String(i + 1).padStart(2, "0")}</span>
              <GoldRule className="my-5" />
              <h3 className="font-heading flex items-center gap-2 text-lg font-bold">
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

function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="industries" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="border-b border-t-accent/40">
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="group flex items-center gap-4 py-5">
                <span className="flex size-11 shrink-0 items-center justify-center border border-t-accent/50 text-t-primary transition group-hover:bg-t-accent group-hover:text-t-accent-fg [&_svg]:size-5">
                  <Icon name={it.icon} />
                </span>
                <span className="font-heading flex-1 text-base font-bold">{t(it.title, ctx.lang)}</span>
                <ArrowRight className="size-4 text-t-accent opacity-0 transition group-hover:opacity-100 rtl:rotate-180" />
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
    <section id="employers" className="bg-t-bg py-12 sm:py-16">
      <Container>
        <div className="grid items-stretch border border-t-accent lg:grid-cols-[1fr_1.1fr]">
          <Img src={d.image} alt="" className="min-h-56 w-full object-cover" fallback={<Globe className="size-14 opacity-30" />} />
          <div className="bg-t-secondary p-8 text-t-secondary-fg sm:p-12">
            <h2 className="font-heading text-3xl font-bold text-t-accent">{t(d.title, ctx.lang)}</h2>
            <GoldRule className="my-5 max-w-xs" />
            <p className="max-w-lg leading-7 opacity-85">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent" />
            </div>
          </div>
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
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="bg-t-secondary" />,
        featuredJobs: () => <JobsByCountry ctx={ctx} />,
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} />,
        process: () => <GoldProcess ctx={ctx} />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
