/**
 * gym-02 "FitFam" (#1102)
 * Friendly family gym: bright teal with coral accents, fully rounded shapes, a rounded photo
 * collage hero, circle trainer cards and a BMI-calculator card sitting beside the facilities.
 */
import { ArrowRight, HeartPulse, Sparkles, Users } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { classesSection, plansSection, transformationsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
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

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: { en: "Free trial", ur: "مفت ٹرائل" }, href: "/join" }}
        className="border-b-0 bg-t-bg/95 shadow-sm [&_.t-btn-primary]:rounded-full [&_.t-btn-primary]:bg-t-accent [&_.t-btn-primary]:text-t-accent-fg [&_a>span.font-heading]:text-t-primary [&_nav_a]:rounded-full"
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: rounded photo collage ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const shots = [h.image, ...(h.slides ?? [])].filter(Boolean).slice(0, 3);
  while (shots.length < 3) shots.push("");
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <div className="pointer-events-none absolute -end-24 -top-24 size-80 rounded-full bg-t-accent/20 blur-2xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-t-accent-fg">
              <Sparkles className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7 py-3" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full bg-t-accent px-7 py-3 text-t-accent-fg hover:brightness-95" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full border border-t-border bg-t-card px-4 py-2 text-sm font-semibold">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Img src={shots[0]} loading="eager" fetchPriority="high" alt="" className="col-span-2 aspect-[16/10] w-full rounded-[2rem] object-cover shadow-sm" fallback={<Users className="size-12 text-t-primary/40" />} />
          <Img src={shots[1]} alt="" className="aspect-square w-full rounded-full object-cover shadow-sm" fallback={<HeartPulse className="size-9 text-t-primary/40" />} />
          <Img src={shots[2]} alt="" className="mt-6 aspect-square w-full rounded-[2rem] object-cover shadow-sm" fallback={<Users className="size-9 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Facilities + BMI card ---------- */
function FeaturesAndBmi({ ctx }: TemplatePageProps) {
  return (
    <div className="bg-t-bg">
      <FeaturesBlock ctx={ctx} variant="grid" columns={3} className="pb-6 [&_.t-card]:rounded-[2rem] [&_span]:rounded-full" />
      <Container className="pb-16 sm:pb-20">
        <BmiCalculator lang={ctx.lang} ctaHref="/join" className="mx-auto max-w-2xl rounded-[2rem] border-t-accent/40 [&_.t-btn]:rounded-full" />
      </Container>
    </div>
  );
}

/* ---------- Hours: rounded card with the ladies-timings note ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-xl rounded-[2rem] bg-t-card p-6 shadow-sm sm:p-9">
          <HoursTable ctx={ctx} title={t(d.title, ctx.lang)} className="[&_h3]:text-t-primary" />
        </div>
      </Container>
    </section>
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
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_.t-card]:rounded-[2rem]" />,
        features: () => <FeaturesAndBmi ctx={ctx} />,
        plans: () => <PlansGrid ctx={ctx} heading={plans ?? undefined} className="bg-t-muted [&_.t-btn]:rounded-full [&_.t-card]:rounded-[2rem]" />,
        classes: () => <ClassTimetable ctx={ctx} heading={classes ?? undefined} className="bg-t-bg [&_button]:rounded-full" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} className="bg-t-muted" />,
        transformations: () =>
          trans ? (
            <GalleryBlock
              ctx={ctx}
              album={trans.album || "transformations"}
              variant="grid"
              columns={4}
              id="transformations"
              heading={{ eyebrow: trans.eyebrow, title: trans.title }}
              className="bg-t-bg [&_button]:rounded-[2rem]"
            />
          ) : null,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted [&_img]:rounded-[2rem]" />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-bg [&_.t-card]:rounded-[2rem]" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-bg [&_.t-btn]:rounded-full [&>div>div]:rounded-[2.5rem]" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" subjectOptions={["Membership", "Group classes", "Ladies timings", "Personal training", "Other"]} className="bg-t-muted [&_.t-card]:rounded-[2rem] [&_.t-btn]:rounded-full" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
