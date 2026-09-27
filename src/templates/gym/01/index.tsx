/**
 * gym-01 "IronPulse" (#1101)
 * Black-and-red strength gym: full-bleed dark hero photo, giant condensed Anton headline cut by
 * a red diagonal band, dark plan cards, dark timetable and a transformations wall.
 */
import { ArrowRight, Dumbbell, Flame, Phone } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { classesSection, plansSection, transformationsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
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

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={{ label: { en: "Join now", ur: "ابھی شامل ہوں" }, href: "/join" }}
        className="border-b-2 border-t-primary [&_a>span.font-heading]:text-2xl [&_a>span.font-heading]:uppercase [&_a>span.font-heading]:tracking-wide [&_nav_a]:text-sm [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-wider"
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" className="border-t-2 border-t-primary" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: dark photo, giant type, red diagonal ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" fallback={<span />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-dark via-t-dark/80 to-t-dark/40" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-20 -skew-y-3 bg-t-primary/90" aria-hidden="true" />
      <Container className="relative py-24 lg:py-36">
        <div className="t-fade-up max-w-3xl">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-t-primary-fg">
              <Flame className="size-3.5" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl lg:text-8xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/75">{t(h.subtitle, lang)}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 py-3.5 text-base font-bold uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border-2 border-t-dark-fg/40 px-7 py-3.5 text-base font-bold uppercase tracking-wider text-t-dark-fg hover:border-t-primary hover:text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-3">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 border border-t-dark-fg/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Stats band + BMI card ---------- */
function StatsAndBmi({ ctx }: TemplatePageProps) {
  return (
    <section id="stats" className="bg-t-dark py-14 text-t-dark-fg sm:py-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
        <StatsBlock ctx={ctx} variant="row" light bare />
        <BmiCalculator lang={ctx.lang} light ctaHref="/join" className="rounded-none border-2 border-t-primary/40" />
      </Container>
    </section>
  );
}

/* ---------- Hours strip ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  const lang = ctx.lang;
  return (
    <section id="hours" className="border-y-2 border-t-primary bg-t-muted py-14 sm:py-16">
      <Container className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div className="border border-t-border bg-t-card p-6 sm:p-8">
          <HoursTable ctx={ctx} title={t(d.title, lang)} className="[&_h3]:uppercase [&_h3]:tracking-wide" />
        </div>
        <div className="flex flex-col gap-4">
          <Dumbbell className="size-9 text-t-primary" aria-hidden="true" />
          {ctx.settings.contact.phone ? (
            <a href={`tel:${ctx.settings.contact.phone}`} className="inline-flex items-center gap-2 font-heading text-2xl uppercase tracking-wide hover:text-t-primary">
              <Phone className="size-5 text-t-primary" /> <span dir="ltr">{ctx.settings.contact.phone}</span>
            </a>
          ) : null}
          <SmartLink href="/join" ctx={ctx} className="t-btn t-btn-primary w-fit px-6 py-3 text-sm font-bold uppercase tracking-wider">
            {t(ui.bookNow, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
          </SmartLink>
        </div>
      </Container>
    </section>
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
        stats: () => <StatsAndBmi ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-bg [&_h2]:uppercase [&_h2]:tracking-tight" />,
        plans: () => <PlansGrid ctx={ctx} heading={plans ?? undefined} light className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        classes: () => <ClassTimetable ctx={ctx} heading={classes ?? undefined} className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-tight" />,
        team: () => <TeamBlock ctx={ctx} variant="card" columns={4} showSpecialties light className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        transformations: () => <TransformationsGallery ctx={ctx} variant="masonry" columns={3} heading={trans ?? undefined} className="bg-t-bg [&_h2]:uppercase [&_h2]:tracking-tight" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-tight [&_img]:rounded-none" />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" light className="bg-t-dark text-t-dark-fg [&_h2]:uppercase [&_h2]:tracking-tight" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-bg [&_h2]:uppercase [&_h2]:tracking-tight" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" subjectOptions={["Membership", "Personal training", "Group classes", "Other"]} className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-tight" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
