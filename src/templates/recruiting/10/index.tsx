/**
 * recruiting-10 "Bridgeway" (#710)
 * Warm, human, photo-led: beige header with serif logo and terracotta CTA, large portrait hero
 * with a quote overlay, testimonials as story cards with photos, warm team section.
 * Rounded, serif headings, human tone.
 */
import * as React from "react";
import { ArrowRight, Heart, Quote, Users } from "lucide-react";
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
  SiteHeader,
  StatsBlock,
  TeamBlock,
} from "@/modules/shared/ui";
import { getTestimonials } from "@/modules/shared/queries";
import { FeaturedJobs } from "@/modules/recruiting/ui";

const soft = "[&_.t-card]:rounded-3xl [&_.t-card]:shadow-sm [&_img]:rounded-3xl";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader ctx={ctx} variant="light" className="[&_.font-heading]:font-semibold [&_.font-heading]:tracking-normal [&_.t-btn]:rounded-full" cta={{ label: { en: "Submit your CV", ur: "اپنا سی وی جمع کریں" }, href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" className="rounded-t-[3rem]" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: large portrait with quote overlay ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const [story] = await getTestimonials(ctx.tenant.id, 1);
  return (
    <section className="overflow-hidden bg-t-bg">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -start-6 -top-6 size-40 rounded-full bg-t-accent/60 blur-2xl" aria-hidden="true" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl" fallback={<Users className="size-20 opacity-30" />} />
          {story ? (
            <figure className="relative -mt-16 ms-4 me-4 rounded-3xl bg-t-card p-6 shadow-xl sm:-mt-20 sm:ms-8 sm:me-0 sm:max-w-md">
              <Quote className="size-7 text-t-primary" aria-hidden="true" />
              <blockquote className="font-heading mt-2 text-lg leading-7 italic">{t(story.text as LocalizedString, lang)}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm">
                <Img src={story.imageUrl ?? ""} alt="" className="size-10 rounded-full object-cover" fallback={<Heart className="size-4 opacity-40" />} />
                <span>
                  <span className="block font-semibold">{story.name}</span>
                  {story.role ? <span className="block text-t-muted-fg">{story.role}</span> : null}
                </span>
              </figcaption>
            </figure>
          ) : null}
        </div>
        <div className="order-1 lg:order-2">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-sm font-semibold text-t-accent-fg">
              <Heart className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-7 text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-t-muted-fg">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 [&_svg]:size-5 [&_svg]:text-t-primary">
                  <Icon name={b.icon} /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: testimonials as story cards ---------- */
async function StoryCards({ ctx }: TemplatePageProps) {
  const d = section(ctx, testimonialsSection);
  if (!d) return null;
  const rows = await getTestimonials(ctx.tenant.id, 6);
  if (!rows.length) return null;
  return (
    <section id="testimonials" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={ctx.lang} />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <li key={r.id} className={cn("flex flex-col overflow-hidden rounded-3xl bg-t-card shadow-sm", i === 0 && "md:col-span-2 lg:col-span-1")}>
              <Img src={r.imageUrl ?? ""} alt={r.name} className="aspect-[4/3] w-full object-cover" fallback={<Users className="size-12 opacity-30" />} />
              <div className="flex flex-1 flex-col p-6">
                <Stars n={r.rating} />
                <blockquote className="font-heading mt-3 flex-1 text-lg leading-7">“{t(r.text as LocalizedString, ctx.lang)}”</blockquote>
                <p className="mt-5 text-sm">
                  <span className="font-semibold">{r.name}</span>
                  {r.role ? <span className="text-t-muted-fg"> · {r.role}</span> : null}
                </p>
              </div>
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
    <section id="industries" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/jobs"} ctx={ctx} className="group flex items-center gap-4 rounded-2xl border border-t-border bg-t-card p-5 transition hover:border-t-primary hover:shadow-md">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-t-accent text-t-accent-fg transition group-hover:bg-t-primary group-hover:text-t-primary-fg [&_svg]:size-6">
                  <Icon name={it.icon} />
                </span>
                <span className="font-heading text-base font-semibold sm:text-lg">{t(it.title, ctx.lang)}</span>
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
        <div className="grid overflow-hidden rounded-[2.5rem] bg-t-secondary text-t-secondary-fg lg:grid-cols-2">
          <Img src={d.image} alt="" className="min-h-64 w-full object-cover" fallback={<Users className="size-14 opacity-30" />} />
          <div className="p-8 sm:p-12 lg:p-14">
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 max-w-lg leading-8 opacity-80">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
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
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-bg [&_dd]:font-semibold" />,
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={t(jobs.eyebrow, ctx.lang)} title={jobs.title} className={cn("bg-t-muted", soft, "[&_.t-btn]:rounded-full")} /> : null),
        industries: () => <Industries ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="image" columns={3} className={cn("bg-t-muted", soft)} />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className={cn("bg-t-muted", soft, "[&_img]:rounded-[2.5rem]")} />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} className={cn(soft, "[&_.t-card]:border-0 [&_.t-card]:bg-t-muted")} />,
        testimonials: () => <StoryCards ctx={ctx} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="[&>div>div]:rounded-[2.5rem] [&_.t-btn]:rounded-full" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" className={cn("bg-t-muted", soft)} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
