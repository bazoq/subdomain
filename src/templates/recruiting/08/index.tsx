/**
 * recruiting-08 "Crew Connect" (#708)
 * Hospitality & cruise staffing, coral: white header with rounded nav and an "Apply" pill,
 * photo-collage hero with search bar, industries as photo tiles, coral stat tiles.
 * Rounded, lively, photo-rich.
 */
import * as React from "react";
import { ArrowRight, Ship, Sparkles } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, statsSection } from "@/templates/shared/sections";
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
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  TeamBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedJobs, JobSearchBar } from "@/modules/recruiting/ui";

const round = "[&_.t-card]:rounded-3xl [&_.t-btn]:rounded-full [&_img]:rounded-3xl";

/** All hero photos (main image + slides) — reused as tile backgrounds for a photo-rich feel. */
function heroPhotos(ctx: TemplatePageProps["ctx"]): string[] {
  const h = section(ctx, heroSection);
  return [h?.image, ...(h?.slides ?? [])].filter((s): s is string => Boolean(s));
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader ctx={ctx} variant="light" className="[&_nav_a]:rounded-full [&_.t-btn]:rounded-full [&_.font-heading]:text-t-primary" cta={{ label: { en: "Apply", ur: "درخواست دیں" }, href: "/jobs" }} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" className="rounded-t-[3rem]" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: photo collage + search ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const photos = heroPhotos(ctx);
  const cell = (i: number, cls: string) => (
    <Img key={i} src={photos[i] ?? ""} alt="" className={cn("h-full w-full rounded-3xl object-cover", cls)} fallback={<Ship className="size-10 opacity-30" />} />
  );
  return (
    <section className="overflow-hidden bg-t-bg">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-muted px-4 py-1.5 text-sm font-bold text-t-primary">
              <Sparkles className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <JobSearchBar ctx={ctx} className="mt-8 rounded-full [&_.t-btn]:rounded-full [&_.t-input]:rounded-full" />
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-accent" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-full border border-t-border px-3 py-1.5 text-sm font-medium [&_svg]:size-4 [&_svg]:text-t-primary">
                  <Icon name={b.icon} /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid h-[28rem] grid-cols-2 grid-rows-3 gap-3 lg:h-[34rem]">
          {cell(0, "row-span-2 rotate-[-1.5deg]")}
          {cell(1, "rotate-[1.5deg]")}
          {cell(2, "row-span-2 rotate-[1deg]")}
          {cell(3, "rotate-[-1deg]")}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: industries as photo tiles ---------- */
function PhotoTiles({ ctx }: TemplatePageProps) {
  const d = section(ctx, industriesSection);
  if (!d || !d.items.length) return null;
  const photos = heroPhotos(ctx);
  return (
    <section id="industries" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const photo = photos.length ? photos[i % photos.length] : "";
            return (
              <li key={i}>
                <SmartLink href={it.href || "/jobs"} ctx={ctx} className={cn("group relative flex aspect-[4/5] items-end overflow-hidden rounded-3xl p-5 text-white", i % 2 ? "bg-gradient-to-br from-t-accent to-t-secondary" : "bg-gradient-to-br from-t-primary to-t-secondary")}>
                  {photo ? (
                    <Img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-t-dark/85 via-t-dark/30 to-transparent" aria-hidden="true" />
                  <Icon name={it.icon} className="absolute end-5 top-5 size-9 opacity-90" />
                  <span className="font-heading relative text-xl font-bold">{t(it.title, ctx.lang)}</span>
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: coral stat tiles ---------- */
function CoralStats({ ctx }: TemplatePageProps) {
  const d = section(ctx, statsSection);
  if (!d || !d.items.length) return null;
  return (
    <section id="stats" className="py-8 sm:py-12">
      <Container>
        <dl className={cn("grid gap-4", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className="rounded-3xl bg-t-primary p-6 text-center text-t-primary-fg sm:p-8">
              <dd className="font-heading text-4xl font-bold tracking-tight">{it.value}</dd>
              <dt className="mt-1 text-sm opacity-85">{t(it.label, ctx.lang)}</dt>
            </div>
          ))}
        </dl>
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
        <div className="grid overflow-hidden rounded-[2.5rem] bg-t-accent text-t-accent-fg lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-14">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">{t(d.title, ctx.lang)}</h2>
            <p className="mt-4 max-w-lg leading-7 opacity-90">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="min-h-56 w-full object-cover" fallback={<Ship className="size-14 opacity-30" />} />
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
        stats: () => <CoralStats ctx={ctx} />,
        featuredJobs: () => (jobs ? <FeaturedJobs ctx={ctx} take={jobs.count || 6} eyebrow={jobs.eyebrow} title={jobs.title} className={cn("bg-t-muted", round)} /> : null),
        industries: () => <PhotoTiles ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="image" columns={3} className={cn("bg-t-muted", round)} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        employersCta: () => <EmployersCta ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className={cn("bg-t-muted", round)} />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className={cn("bg-t-muted", round)} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className={cn(round, "[&>div>div]:rounded-[2.5rem]")} />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" className={round} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
