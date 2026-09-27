/**
 * recruiting-07 "Apna Rozgar" (#707)
 * Urdu-friendly green & white community centre: green header with crescent mark and a
 * prominent language switch, simple big-type hero with two large buttons and a visible phone
 * number, industries as big colourful tiles, testimonials with photos. Large type, high contrast.
 */
import * as React from "react";
import { ArrowRight, Phone, Quote, Users } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, testimonialsSection } from "@/templates/shared/sections";
import { employersCtaSection, featuredJobsSection, industriesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, Stars, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
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
  StatsBlock,
  TeamBlock,
} from "@/modules/shared/ui";
import { getTestimonials } from "@/modules/shared/queries";
import { FeaturedJobs } from "@/modules/recruiting/ui";
import { CommunityHeader } from "./header";

const big = "[&_h2]:text-4xl sm:[&_h2]:text-5xl [&_p]:text-lg [&_h3]:text-xl";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col text-[17px] leading-relaxed">
      <AnnouncementBar ctx={ctx} variant="accent" className="text-base font-semibold" />
      <CommunityHeader ctx={ctx} cta={{ label: ctx.lang === "ur" ? "اپنا سی وی جمع کریں" : "Submit your CV", href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="primary" className="[&_a]:text-base [&_p]:text-base" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: simple, big headline, two large buttons, phone visible ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const phone = ctx.settings.contact.phone;
  return (
    <section className="bg-t-muted">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
        <div className="text-center lg:text-start">
          {t(h.eyebrow, lang) ? <span className="inline-block rounded-full bg-t-primary px-5 py-2 text-base font-bold text-t-primary-fg">{t(h.eyebrow, lang)}</span> : null}
          <h1 className="font-heading mt-6 text-4xl font-extrabold leading-[1.15] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-t-muted-fg lg:mx-0">{t(h.subtitle, lang)}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-10 py-5 text-xl" icon={<ArrowRight className="size-6 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-accent px-10 py-5 text-xl" />
          </div>
          {phone ? (
            <a href={`tel:${phone}`} className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-t-primary bg-t-card px-6 py-3 text-2xl font-extrabold text-t-primary hover:bg-t-primary hover:text-t-primary-fg">
              <Phone className="size-7" /> <span dir="ltr">{phone}</span>
            </a>
          ) : null}
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-base font-semibold lg:justify-start">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 [&_svg]:size-6 [&_svg]:text-t-primary">
                  <Icon name={b.icon} /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Img src={h.image} alt="" className="hidden aspect-square w-full rounded-[var(--t-radius)] object-cover shadow-xl lg:block" fallback={<Users className="size-20 opacity-30" />} />
      </Container>
    </section>
  );
}

/* ---------- Signature: big colourful tiles ---------- */
function Industries({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  const tones = ["bg-t-primary text-t-primary-fg", "bg-t-accent text-t-accent-fg", "bg-t-secondary text-t-secondary-fg", "bg-t-card text-t-fg border-2 border-t-primary"];
  return (
    <section id="industries" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className={big} />
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className={cn("flex min-h-44 flex-col items-center justify-center gap-4 rounded-[var(--t-radius)] p-6 text-center font-heading text-xl font-extrabold shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:text-2xl [&_svg]:size-12", tones[i % tones.length])}>
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

/* ---------- Signature: testimonials with photos ---------- */
async function PhotoTestimonials({ ctx }: TemplatePageProps) {
  const d = section(ctx, testimonialsSection);
  if (!d) return null;
  const rows = await getTestimonials(ctx.tenant.id, 6);
  if (!rows.length) return null;
  return (
    <section id="testimonials" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={ctx.lang} className={big} />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id} className="t-card flex flex-col p-7">
              <div className="flex items-center gap-4">
                <Img src={r.imageUrl ?? ""} alt={r.name} className="size-20 shrink-0 rounded-full object-cover ring-4 ring-t-primary/20" fallback={<Users className="size-8 opacity-40" />} />
                <div>
                  <p className="text-lg font-extrabold">{r.name}</p>
                  {r.role ? <p className="text-base text-t-muted-fg">{r.role}</p> : null}
                  <Stars n={r.rating} className="mt-1" />
                </div>
              </div>
              <Quote className="mt-5 size-8 text-t-accent" aria-hidden="true" />
              <blockquote className="mt-2 text-lg leading-8">{t(r.text as LocalizedString, ctx.lang)}</blockquote>
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
        <div className="grid overflow-hidden rounded-[var(--t-radius)] bg-t-secondary text-t-secondary-fg lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 text-lg leading-8 opacity-85">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent px-8 py-4 text-lg" />
            </div>
          </div>
          <Img src={d.image} alt="" className="min-h-56 w-full object-cover" fallback={<Users className="size-14 opacity-30" />} />
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
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_dd]:text-5xl [&_dt]:text-base" />,
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={t(jobs.eyebrow, ctx.lang)} title={jobs.title} className={cn("bg-t-muted", big, "[&_.t-btn]:px-8 [&_.t-btn]:py-4 [&_.t-btn]:text-lg")} /> : null),
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={2} className={cn("bg-t-muted", big)} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className={big} />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className={cn("bg-t-muted", big)} />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={3} className={big} />,
        testimonials: () => <PhotoTestimonials ctx={ctx} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className={cn(big, "[&_button]:text-lg")} />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_.t-btn]:px-10 [&_.t-btn]:py-5 [&_.t-btn]:text-xl" />,
        contact: () => <ContactBlock ctx={ctx} layout="stacked" formKey="contact" className={big} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
