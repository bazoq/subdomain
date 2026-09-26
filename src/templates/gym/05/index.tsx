/**
 * gym-05 "Ladies Fit" (#1105)
 * Women-only fitness centre: plum on blush, soft pill shapes, an arched hero portrait, a
 * women-only privacy pill, ladies-only plan framing and a free-trial form under the CTA.
 */
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { classesSection, plansSection, transformationsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
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
import { TransformationsGallery } from "@/modules/gym/ui/transformations-gallery";
import { BmiCalculator } from "@/modules/gym/ui/bmi-calculator";
import { TrialForm } from "@/modules/gym/ui/trial-form";

/** Fixed template badge for the women-only positioning. */
const WOMEN_ONLY: LocalizedString = { en: "Women only · privacy guaranteed", ur: "صرف خواتین · مکمل پرائیویسی" };

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: { en: "Join today", ur: "آج شامل ہوں" }, href: "/join" }}
        className="border-b-0 bg-t-muted/90 [&_.t-btn-primary]:rounded-full [&_a>span.font-heading]:text-t-primary [&_nav_a]:rounded-full [&_nav_a]:font-medium"
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: arched portrait + privacy pill ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <div className="pointer-events-none absolute -start-32 top-0 size-96 rounded-full bg-t-accent/40 blur-3xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-accent-fg">
              <Sparkles className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-t-primary/30 bg-t-muted px-4 py-2 text-sm font-semibold text-t-primary">
            <ShieldCheck className="size-4" /> {t(WOMEN_ONLY, lang)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7 py-3" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full border border-t-primary bg-transparent px-7 py-3 text-t-primary hover:bg-t-primary hover:text-t-primary-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full bg-t-muted px-4 py-2 text-sm font-medium">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <span className="absolute inset-0 -rotate-3 rounded-[14rem_14rem_2.5rem_2.5rem] bg-t-accent/60" aria-hidden="true" />
          <Img
            src={h.image}
            alt=""
            className="relative aspect-[4/5] w-full rounded-[14rem_14rem_2.5rem_2.5rem] object-cover shadow-lg"
            fallback={<HeartPulse className="size-14 text-t-primary/40" />}
          />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Plans with ladies-only framing ---------- */
function Plans({ ctx, heading }: TemplatePageProps & { heading?: HeadingData }) {
  return (
    <div className="bg-t-muted">
      <Container className="pt-16 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-t-primary px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">
          <ShieldCheck className="size-3.5" /> {t(WOMEN_ONLY, ctx.lang)}
        </span>
      </Container>
      <PlansGrid ctx={ctx} heading={heading} className="bg-t-muted [&_.t-btn]:rounded-full [&_.t-card]:rounded-[2rem]" />
    </div>
  );
}

/* ---------- About + body check ---------- */
function AboutAndBmi({ ctx }: TemplatePageProps) {
  return (
    <div className="bg-t-bg">
      <AboutBlock ctx={ctx} variant="split" className="[&_img]:rounded-[2rem]" />
      <Container className="pb-16 sm:pb-20">
        <BmiCalculator lang={ctx.lang} ctaHref="/join" className="mx-auto max-w-2xl rounded-[2rem] bg-t-muted [&_.t-btn]:rounded-full" />
      </Container>
    </div>
  );
}

/* ---------- Hours ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-xl rounded-[2.5rem] bg-t-card p-6 shadow-sm sm:p-9">
          <HoursTable ctx={ctx} title={t(d.title, ctx.lang)} className="[&_h3]:text-t-primary" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- CTA + free-trial form ---------- */
function CtaAndTrial({ ctx }: TemplatePageProps) {
  return (
    <div className="bg-t-bg">
      <CtaBlock ctx={ctx} variant="card" className="[&_.t-btn]:rounded-full [&>div>div]:rounded-[2.5rem]" />
      <Container className="pb-16 sm:pb-20">
        <TrialForm ctx={ctx} className="mx-auto max-w-2xl rounded-[2rem] [&_.t-btn]:rounded-full" />
      </Container>
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const plans = sectionData<HeadingData>(ctx, plansSection);
  const classes = sectionData<HeadingData>(ctx, classesSection);
  const trans = sectionData<HeadingData>(ctx, transformationsSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_.t-card]:rounded-[2rem] [&_.t-card]:bg-t-muted [&_.t-card]:border-0" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted [&_.t-card]:rounded-[2rem] [&_span]:rounded-full" />,
        plans: () => <Plans ctx={ctx} heading={plans ?? undefined} />,
        classes: () => <ClassTimetable ctx={ctx} heading={classes ?? undefined} className="bg-t-bg [&_button]:rounded-full" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} className="bg-t-muted" />,
        transformations: () => <TransformationsGallery ctx={ctx} variant="grid" columns={3} heading={trans ?? undefined} className="bg-t-bg [&_button]:rounded-[2rem]" />,
        about: () => <AboutAndBmi ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-bg [&_figure]:rounded-[2rem]" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaAndTrial ctx={ctx} />,
        contact: () => <ContactBlock ctx={ctx} layout="split" subjectOptions={["Membership", "Zumba", "Yoga", "Aerobics", "Personal training", "Other"]} className="bg-t-muted [&_.t-card]:rounded-[2rem] [&_.t-btn]:rounded-full" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
