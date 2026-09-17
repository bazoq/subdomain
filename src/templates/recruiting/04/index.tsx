/**
 * recruiting-04 "WorkForce PK" (#704)
 * Blue-collar, bold & simple: charcoal header with condensed uppercase nav, worker photo hero
 * with three huge category buttons, industries as big icon buttons, large-number process,
 * huge WhatsApp CTA. Large touch targets, high contrast, minimal text.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, HardHat, MessageCircle, Phone, Truck, Wrench } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { ctaSection, heroSection, processSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  FaqBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedJobs, jobsHref } from "@/modules/recruiting/ui";

const QUICK = [
  { q: "driver", en: "Drivers", ur: "ڈرائیورز", icon: Truck },
  { q: "labour", en: "Labour", ur: "مزدور", icon: HardHat },
  { q: "technician", en: "Technicians", ur: "ٹیکنیشنز", icon: Wrench },
];

/* ---------- Layout: charcoal header, condensed uppercase nav ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        className="font-heading uppercase tracking-wide [&_nav_a]:text-base [&_nav_a]:tracking-wider [&_.t-btn]:text-base [&_.t-btn]:tracking-wider"
        cta={{ label: { en: "Apply now", ur: "ابھی درخواست دیں" }, href: "/jobs" }}
      />
      <div className="h-1.5 w-full bg-t-primary" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: worker photo, condensed headline, three big buttons ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const phone = ctx.settings.contact.phone;
  return (
    <section className="bg-t-bg">
      <div className="grid lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center px-4 py-14 sm:px-8 lg:order-1 lg:px-16 lg:py-24">
          {h.eyebrow ? <span className="inline-block bg-t-accent px-3 py-1 font-heading text-sm font-bold uppercase tracking-widest text-t-accent-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-xl leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {QUICK.map((b) => (
              <li key={b.q}>
                <Link href={jobsHref({ q: b.q })} className="flex h-full flex-col items-center justify-center gap-2 border-4 border-t-dark bg-t-dark px-4 py-6 text-center font-heading text-xl font-bold uppercase tracking-wide text-t-dark-fg transition hover:border-t-primary hover:bg-t-primary">
                  <b.icon className="size-10" aria-hidden="true" />
                  {lang === "ur" ? b.ur : b.en}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-8 py-4 text-lg uppercase" icon={<ArrowRight className="size-5 rtl:rotate-180" />} />
            {phone ? (
              <a href={`tel:${phone}`} className="t-btn t-btn-outline px-8 py-4 text-lg">
                <Phone className="size-5" /> <span dir="ltr">{phone}</span>
              </a>
            ) : null}
          </div>
        </div>
        <div className="relative order-1 min-h-72 lg:order-2">
          <Img src={h.image} alt="" className="h-full w-full object-cover lg:absolute lg:inset-0" fallback={<HardHat className="size-20 opacity-30" />} />
          <div className="absolute inset-x-0 bottom-0 h-3 bg-t-primary" aria-hidden="true" />
          {h.badges?.length ? (
            <ul className="absolute start-4 top-4 flex flex-col gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 bg-t-dark px-3 py-2 text-sm font-bold uppercase text-t-dark-fg [&_svg]:size-4 [&_svg]:text-t-accent">
                  <Icon name={b.icon} /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------- Signature: industries as big icon buttons ---------- */
function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="industries" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="[&_h2]:uppercase" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink
                href={it.href || "/jobs"}
                ctx={ctx}
                className={cn(
                  "flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-8 text-center font-heading text-xl font-bold uppercase tracking-wide transition hover:scale-[1.02] [&_svg]:size-12",
                  i % 3 === 0 ? "bg-t-primary text-t-primary-fg" : i % 3 === 1 ? "bg-t-dark text-t-dark-fg" : "bg-t-accent text-t-accent-fg",
                )}
              >
                <Icon name={it.icon} />
                {t(it.title, ctx.lang)}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: process with large numbers ---------- */
function BigNumberProcess({ ctx }: TemplatePageProps) {
  const d = section(ctx, processSection);
  if (!d || !d.steps.length) return null;
  return (
    <section id="process" className="bg-t-bg py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="[&_h2]:uppercase" />
        <ol className={cn("grid gap-4", d.steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          {d.steps.map((s, i) => (
            <li key={i} className="relative overflow-hidden border-2 border-t-dark p-6 pt-8">
              <span className="font-heading pointer-events-none absolute -top-4 -end-2 text-[7rem] font-bold leading-none text-t-primary/15" aria-hidden="true">
                {i + 1}
              </span>
              <span className="flex size-14 items-center justify-center bg-t-primary text-t-primary-fg [&_svg]:size-7">
                <Icon name={s.icon} />
              </span>
              <h3 className="font-heading mt-4 text-2xl font-bold uppercase">
                {i + 1}. {t(s.title, ctx.lang)}
              </h3>
              <p className="mt-2 text-base text-t-muted-fg">{t(s.text, ctx.lang)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Signature: huge WhatsApp CTA ---------- */
function HugeCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, ctaSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="cta" className="bg-t-primary py-16 text-center text-t-primary-fg sm:py-24">
      <Container>
        <h2 className="font-heading text-4xl font-bold uppercase leading-tight sm:text-6xl">{title}</h2>
        {t(d.text, ctx.lang) ? <p className="mx-auto mt-4 max-w-2xl text-xl opacity-90">{t(d.text, ctx.lang)}</p> : null}
        <div className="mt-10">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn bg-t-dark px-10 py-6 font-heading text-2xl uppercase tracking-wider text-t-dark-fg shadow-2xl hover:bg-t-accent hover:text-t-accent-fg sm:text-3xl" icon={<MessageCircle className="size-8" />} />
        </div>
      </Container>
    </section>
  );
}

function EmployersCta({ ctx }: TemplatePageProps) {
  const d = section(ctx, employersCtaSection);
  if (!d) return null;
  return (
    <section id="employers" className="bg-t-dark text-t-dark-fg">
      <div className="grid lg:grid-cols-2">
        <Img src={d.image} alt="" className="min-h-64 w-full object-cover" />
        <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
          <h2 className="font-heading text-4xl font-bold uppercase leading-tight">{t(d.title, ctx.lang)}</h2>
          <p className="mt-4 max-w-lg text-lg text-t-dark-fg/75">{t(d.text, ctx.lang)}</p>
          <div className="mt-8">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent px-8 py-4 text-lg uppercase" icon={<ArrowRight className="size-5 rtl:rotate-180" />} />
          </div>
        </div>
      </div>
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
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_dd]:text-5xl" />,
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={jobs.eyebrow} title={jobs.title} className="bg-t-muted [&_h2]:uppercase [&_.t-btn]:px-8 [&_.t-btn]:py-4 [&_.t-btn]:text-lg" /> : null),
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="list" className="[&_h2]:uppercase" />,
        process: () => <BigNumberProcess ctx={ctx} />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_h2]:uppercase" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} className="bg-t-muted [&_h2]:uppercase" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" className="[&_h2]:uppercase" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted [&_h2]:uppercase" />,
        cta: () => <HugeCta ctx={ctx} />,
        contact: () => <ContactBlock ctx={ctx} layout="stacked" formKey="contact" className="[&_h2]:uppercase" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
