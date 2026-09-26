/**
 * gym-04 "CrossBox" (#1104)
 * Industrial CrossFit box: concrete-grid surfaces, safety-yellow hazard stripes, square corners,
 * stencil Bebas headings, oversized stat numbers and membership plans drawn as torn ticket cards.
 */
import { ArrowRight, Dumbbell, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { classesSection, plansSection, transformationsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  HoursTable,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData } from "@/modules/shared/ui/section-types";
import { PlansGrid } from "@/modules/gym/ui/plans-grid";
import { ClassTimetable } from "@/modules/gym/ui/class-timetable";
import { BmiCalculator } from "@/modules/gym/ui/bmi-calculator";

const STENCIL = "[&_h2]:uppercase [&_h2]:tracking-[0.06em]";

/* ---------- signature: hazard tape + concrete grid ---------- */
function Hazard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 w-full", className)}
      style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--t-primary) 0 12px, var(--t-secondary) 12px 24px)" }}
    />
  );
}

function Concrete({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 opacity-50", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, var(--t-border) 0 1px, transparent 1px 7px), repeating-linear-gradient(90deg, var(--t-border) 0 1px, transparent 1px 7px)",
      }}
    />
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={{ label: { en: "Join now", ur: "ابھی شامل ہوں" }, href: "/join" }}
        className="[&_a>span.font-heading]:text-3xl [&_a>span.font-heading]:uppercase [&_a>span.font-heading]:tracking-[0.08em] [&_a>span.font-heading]:text-t-primary [&_nav_a]:text-sm [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-[0.12em]"
      />
      <Hazard />
      <main id="main" className="flex-1">{children}</main>
      <Hazard />
      <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-primary" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: concrete wall, stencil headline, yellow tape ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Concrete />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-block bg-t-secondary px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-t-primary">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-6 text-5xl uppercase leading-[0.95] tracking-[0.02em] sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <div className="mt-6 max-w-lg -rotate-1 bg-t-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-t-primary-fg">
            {ctx.settings.contact.city || ctx.tenant.name}
          </div>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 py-3.5 text-base font-bold uppercase tracking-widest" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border-2 border-t-secondary px-7 py-3.5 text-base font-bold uppercase tracking-widest text-t-fg hover:bg-t-secondary hover:text-t-accent-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 border-2 border-t-secondary bg-t-card px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  <span className="text-t-fg [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute inset-0 translate-x-3 translate-y-3 border-4 border-t-primary" aria-hidden="true" />
          <Img src={h.image} alt="" className="relative aspect-[4/5] w-full border-4 border-t-secondary object-cover" fallback={<Dumbbell className="size-14 text-t-fg/30" />} />
        </div>
      </Container>
      <Hazard />
    </section>
  );
}

/* ---------- Hours: hazard-framed board ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="relative overflow-hidden bg-t-muted py-16 sm:py-20">
      <Concrete />
      <Container className="relative">
        <div className="mx-auto max-w-2xl border-4 border-t-secondary bg-t-card">
          <Hazard />
          <div className="p-6 sm:p-9">
            <HoursTable ctx={ctx} title={t(d.title, ctx.lang)} className="[&_h3]:text-2xl [&_h3]:uppercase [&_h3]:tracking-[0.08em]" />
            <p className="mt-6 inline-flex items-center gap-2 bg-t-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-t-primary">
              <Timer className="size-3.5" /> {ctx.settings.contact.phone || ctx.settings.contact.whatsapp}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Contact + body-check ticket ---------- */
function ContactAndBmi({ ctx }: TemplatePageProps) {
  return (
    <div className="bg-t-bg">
      <Container className="pt-16 sm:pt-20">
        <BmiCalculator lang={ctx.lang} ctaHref="/join" className="mx-auto max-w-2xl border-4 border-t-secondary [&_.t-btn]:uppercase [&_.t-btn]:tracking-widest" />
      </Container>
      <ContactBlock ctx={ctx} layout="split" subjectOptions={["Drop-in", "Membership", "Personal training", "Kids class", "Other"]} className={`bg-t-bg ${STENCIL}`} />
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const plans = sectionData<HeadingData>(ctx, plansSection);
  const classes = sectionData<HeadingData>(ctx, classesSection);
  const trans = section(ctx, transformationsSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="bg-t-dark [&_dd]:text-5xl [&_dd]:sm:text-6xl [&_dd]:uppercase [&_dd]:text-t-primary" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className={`bg-t-bg ${STENCIL} [&_.t-card]:border-2 [&_.t-card]:border-t-secondary`} />,
        plans: () => <PlansGrid ctx={ctx} heading={plans ?? undefined} className={`bg-t-muted ${STENCIL} [&_.t-card]:border-2 [&_.t-card]:border-dashed [&_.t-card]:border-t-secondary [&_h3]:uppercase [&_h3]:tracking-wide [&_.t-btn]:uppercase [&_.t-btn]:tracking-widest`} />,
        classes: () => <ClassTimetable ctx={ctx} heading={classes ?? undefined} light className={`bg-t-dark ${STENCIL} [&_button]:uppercase [&_button]:tracking-wider`} />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} showSpecialties className={`bg-t-bg ${STENCIL}`} />,
        transformations: () =>
          trans ? (
            <GalleryBlock
              ctx={ctx}
              album={trans.album || "transformations"}
              variant="grid"
              columns={4}
              id="transformations"
              heading={{ eyebrow: trans.eyebrow, title: trans.title }}
              className={`bg-t-muted ${STENCIL} [&_button]:border-2 [&_button]:border-t-secondary`}
            />
          ) : null,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className={`bg-t-bg ${STENCIL} [&_img]:border-4 [&_img]:border-t-secondary`} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className={`bg-t-muted ${STENCIL} [&_figure]:border-2 [&_figure]:border-t-secondary`} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className={`bg-t-bg ${STENCIL}`} />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className={STENCIL} />,
        contact: () => <ContactAndBmi ctx={ctx} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
