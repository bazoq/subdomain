/**
 * law-05 "Justice Dark" (#1305)
 * Dark premium litigation firm: charcoal with gold, Cinzel headings, dramatic photography.
 * Black header with gold logo and minimal nav (phone instead of a button), full-bleed dark
 * courtroom hero with a gold headline and a single CTA, case results in gold, attorneys in
 * dark cards, practice areas as a list with gold numerals. Square corners, gold hairlines.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Gavel, Phone } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, SectionHeading, WhatsAppFloat, Img } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  ProcessBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData } from "@/modules/shared/ui/section-types";

const PRACTICE_SUBJECTS = ["Civil", "Criminal", "Family", "Property", "Corporate", "Other"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Thin gold rule used between sections. */
function GoldRule() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-t-primary to-transparent" aria-hidden="true" />;
}

/* ---------- Layout: black header, gold logo, phone instead of a button ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const phone = ctx.settings.contact.phone;
  return (
    <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={null}
        className="border-b border-t-primary/40 [&>div>a>span]:text-t-primary [&>div>a>span]:tracking-[0.15em] [&_nav_a]:text-xs [&_nav_a]:uppercase [&_nav_a]:tracking-[0.2em]"
        rightSlot={
          phone ? (
            <a href={`tel:${phone}`} className="hidden items-center gap-2 border border-t-primary/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-t-primary transition hover:bg-t-primary hover:text-t-primary-fg md:inline-flex" dir="ltr">
              <Phone className="size-3.5" /> {phone}
            </a>
          ) : null
        }
      />
      <main id="main" className="flex-1">{children}</main>
      <GoldRule />
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: dark courtroom photo, gold headline, single CTA ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? (
        <Img src={h.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" loading="eager" fetchPriority="high" />
      ) : (
        <Gavel className="absolute -end-10 bottom-0 -z-10 size-96 text-t-primary/10" aria-hidden="true" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-t-bg via-t-dark/60 to-t-dark/30" aria-hidden="true" />
      <Container className="flex min-h-[70vh] flex-col justify-end pb-20 pt-24 lg:pb-28 lg:pt-36">
        <div className="t-fade-up max-w-3xl">
          {h.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">
              <span className="h-px w-10 bg-t-primary" aria-hidden="true" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.1] text-t-primary sm:text-5xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/80">{t(h.subtitle, lang)}</p>
          <div className="mt-10">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-8 uppercase tracking-[0.15em]" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
          {h.badges?.length ? (
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-t-primary/30 pt-6">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-t-dark-fg/80">
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

/* ---------- Signature: practice areas list with gold numerals ---------- */
async function GoldNumeralAreas({ ctx }: TemplatePageProps) {
  const d = sectionData<HeadingData>(ctx, practiceAreasSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: 10 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="practice-areas" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} className="[&_h2]:text-t-primary" />
        <ol className="mx-auto max-w-4xl divide-y divide-t-border border-y border-t-border">
          {rows.map((s, i) => {
            const name = t(s.name as LocalizedString, lang);
            const summary = t(s.summary as LocalizedString, lang);
            return (
              <li key={s.id}>
                <Link href={`/services/${s.slug}`} className="group flex items-start gap-6 py-6 transition hover:bg-t-muted sm:px-4">
                  <span className="font-heading w-12 shrink-0 text-2xl font-bold text-t-primary">{ROMAN[i] ?? i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-heading block text-xl font-bold uppercase tracking-wide text-t-fg group-hover:text-t-primary">{name}</span>
                    {summary ? <span className="mt-1 block text-sm leading-6 text-t-muted-fg">{summary}</span> : null}
                  </span>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-t-primary/60 transition group-hover:translate-x-1 group-hover:text-t-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ol>
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
        practiceAreas: () => <GoldNumeralAreas ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted [&_h2]:text-t-primary" />,
        stats: () => (
          <>
            <GoldRule />
            <StatsBlock ctx={ctx} variant="row" className="bg-t-bg [&_dd]:font-heading [&_dd]:text-5xl [&_dd]:text-t-primary" />
            <GoldRule />
          </>
        ),
        team: () => <TeamBlock ctx={ctx} variant="card" columns={3} showSpecialties className="[&_h2]:text-t-primary" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="bg-t-muted [&_h2]:text-t-primary" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_h2]:text-t-primary" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted [&_h2]:text-t-primary" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_h2]:text-t-primary" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_.t-btn-accent]:bg-t-dark [&_.t-btn-accent]:text-t-dark-fg" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="consultation" subjectOptions={PRACTICE_SUBJECTS} className="bg-t-muted [&_h2]:text-t-primary" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
