/**
 * gym-03 "Zen Studio" (#1103)
 * Calm yoga & pilates studio: sage and cream, airy spacing, Cormorant serif headings, a single
 * quiet hero CTA, borderless quote testimonials and a hours-plus-body-check wellness panel.
 */
import { ArrowRight, Flower2, Leaf, MapPin } from "lucide-react";
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

const SERIF = "[&_h2]:font-normal [&_h2]:tracking-normal";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: { en: "Book a class", ur: "کلاس بک کریں" }, href: "/join" }}
        className="border-b-0 bg-t-bg/90 [&_a>span.font-heading]:font-normal [&_a>span.font-heading]:tracking-[0.15em] [&_nav_a]:text-sm [&_nav_a]:font-normal [&_nav_a]:tracking-wide"
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="light" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: centred serif headline, one soft image, one CTA ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg">
      <Container className="py-20 text-center sm:py-28">
        <div className="t-fade-up mx-auto max-w-3xl">
          <Leaf className="mx-auto size-7 text-t-primary" aria-hidden="true" />
          {h.eyebrow ? <span className="mt-6 block text-xs font-medium uppercase tracking-[0.4em] text-t-muted-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-6 text-4xl font-normal leading-[1.15] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-8 py-3.5 text-base" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="text-sm font-medium text-t-primary underline-offset-4 hover:underline" />
          </div>
        </div>
        <div className="relative mt-16">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[21/9] w-full rounded-[var(--t-radius)] object-cover" fallback={<Flower2 className="size-14 text-t-primary/40" />} />
        </div>
        {h.badges?.length ? (
          <ul className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-t-muted-fg">
            {h.badges.map((b, i) => (
              <li key={i} className="inline-flex items-center gap-2">
                <span className="text-t-primary [&_svg]:size-4">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Hours + body check-in, side by side ---------- */
function HoursAndCheckIn({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="hours" className="bg-t-muted py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {ctx.settings.hours.length ? (
          <div className="rounded-[var(--t-radius)] bg-t-card p-7 sm:p-9">
            <HoursTable ctx={ctx} title={t(d.title, lang)} className="[&_h3]:font-normal [&_h3]:text-xl" />
            {ctx.settings.contact.address ? (
              <p className="mt-6 flex items-start gap-2 text-sm text-t-muted-fg">
                <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" /> {ctx.settings.contact.address}
              </p>
            ) : null}
          </div>
        ) : null}
        <BmiCalculator lang={lang} ctaHref="/join" className="bg-t-card" />
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
        stats: () => <StatsBlock ctx={ctx} variant="row" className="bg-t-bg" />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className={`bg-t-muted ${SERIF}`} />,
        plans: () => <PlansGrid ctx={ctx} heading={plans ?? undefined} className={`bg-t-bg ${SERIF} [&_.t-card]:shadow-none [&_h3]:font-normal`} />,
        classes: () => <ClassTimetable ctx={ctx} heading={classes ?? undefined} className={`bg-t-muted ${SERIF}`} />,
        team: () => <TeamBlock ctx={ctx} variant="wide" columns={2} className={`bg-t-bg ${SERIF}`} />,
        transformations: () =>
          trans ? (
            <GalleryBlock
              ctx={ctx}
              album={trans.album || "transformations"}
              variant="strip"
              id="transformations"
              heading={{ eyebrow: trans.eyebrow, title: trans.title }}
              className={`bg-t-muted ${SERIF}`}
            />
          ) : null,
        about: () => <AboutBlock ctx={ctx} variant="centered" className={`bg-t-bg ${SERIF}`} />,
        hours: () => <HoursAndCheckIn ctx={ctx} />,
        testimonials: () => (
          <TestimonialsBlock ctx={ctx} variant="masonry" columns={2} className={`bg-t-bg ${SERIF} [&_figure]:border-0 [&_figure]:bg-transparent [&_blockquote]:font-heading [&_blockquote]:text-xl`} />
        ),
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className={`bg-t-muted ${SERIF}`} />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className={`bg-t-bg ${SERIF}`} />,
        contact: () => <ContactBlock ctx={ctx} layout="stacked" subjectOptions={["Yoga", "Pilates", "Meditation", "Private session", "Other"]} className={`bg-t-muted ${SERIF}`} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
