/**
 * law-06 "Solo Advocate" (#1306)
 * Personal-brand layout for a single advocate. Simple header that uses the advocate's name
 * (first team member) as the logo with a phone link, big portrait hero with name +
 * credentials and CTAs, about block rendered as a credentials timeline, compact practice
 * areas, testimonials. Clean, maroon accent, medium corners.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Phone, UserRound } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { aboutSection, heroSection } from "@/templates/shared/sections";
import { practiceAreasSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices, getTeam } from "@/modules/shared/queries";
import {
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
import type { AboutData, HeadingData } from "@/modules/shared/ui/section-types";

const PRACTICE_SUBJECTS = ["Civil", "Criminal", "Family", "Property", "Corporate", "Other"];

/** The advocate = first active team member (falls back to tenant name). */
async function advocateFor(tenantId: string) {
  const [m] = await getTeam(tenantId, 1);
  return m ?? null;
}

/* ---------- Layout: advocate's name as logo, nav, phone ---------- */
async function Layout({ ctx, children }: TemplateLayoutProps) {
  const adv = await advocateFor(ctx.tenant.id);
  const name = adv?.name ?? ctx.tenant.name;
  const phone = adv?.phone || ctx.settings.contact.phone;
  const brandedCtx = adv && !ctx.settings.branding.logoUrl ? { ...ctx, tenant: { ...ctx.tenant, name } } : ctx;
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader
        ctx={brandedCtx}
        variant="light"
        cta={null}
        className="[&>div>a>span]:font-medium [&>div>a>span]:text-t-primary"
        rightSlot={
          phone ? (
            <a href={`tel:${phone}`} className="hidden items-center gap-2 rounded-[var(--t-radius)] border border-t-border px-3 py-2 text-sm font-semibold text-t-fg transition hover:border-t-primary hover:text-t-primary md:inline-flex" dir="ltr">
              <Phone className="size-4 text-t-primary" /> {phone}
            </a>
          ) : null
        }
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: large portrait left, name + credentials right ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const adv = await advocateFor(ctx.tenant.id);
  const portrait = h.image || adv?.imageUrl || "";
  const role = t(adv?.role as LocalizedString | undefined, lang);
  return (
    <section className="bg-t-bg">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -start-3 -top-3 h-full w-full rounded-[var(--t-radius)] border-2 border-t-primary/40" aria-hidden="true" />
          <Img src={portrait} alt={adv?.name ?? ""} className="relative aspect-[4/5] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<UserRound className="size-20 opacity-30" />} />
        </div>
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-block rounded-[var(--t-radius)] bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">{h.eyebrow}</span> : null}
          {adv ? (
            <p className="font-heading mt-5 text-2xl text-t-muted-fg">
              {adv.name}
              {role ? <span className="text-t-primary"> · {role}</span> : null}
            </p>
          ) : null}
          <h1 className="font-heading mt-2 text-4xl font-medium leading-[1.1] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          {h.badges?.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-[var(--t-radius)] bg-t-muted px-3 py-1.5 text-sm font-medium text-t-fg">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: about as a credentials timeline ---------- */
function CredentialsTimeline({ ctx }: TemplatePageProps) {
  const d = sectionData<AboutData>(ctx, aboutSection);
  if (!d) return null;
  return (
    <section id="about" className="bg-t-muted py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={ctx.lang} className="mb-4" />
          <RichText value={d.body} lang={ctx.lang} className="text-t-muted-fg" />
          <div className="mt-8">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
        </div>
        <div>
          {d.image ? <Img src={d.image} alt="" className="mb-8 aspect-[3/2] w-full rounded-[var(--t-radius)] object-cover" /> : null}
          {d.highlights?.length ? (
            <ol className="relative border-s-2 border-t-primary/30 ps-8">
              {d.highlights.map((hl, i) => (
                <li key={i} className="relative pb-8 last:pb-0">
                  <span className="absolute -start-[2.45rem] top-0 flex size-9 items-center justify-center rounded-full bg-t-primary text-t-primary-fg ring-4 ring-t-muted [&_svg]:size-4">
                    <Icon name={hl.icon} />
                  </span>
                  <p className="font-heading pt-1.5 text-xl text-t-fg">{t(hl.text, ctx.lang)}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: compact practice areas ---------- */
async function CompactPracticeAreas({ ctx }: TemplatePageProps) {
  const d = sectionData<HeadingData>(ctx, practiceAreasSection);
  if (!d) return null;
  const rows = await getServices(ctx.tenant.id, { take: 12 });
  if (!rows.length) return null;
  const lang = ctx.lang;
  return (
    <section id="practice-areas" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={lang} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/services/${s.slug}`} className="group flex items-center gap-3 rounded-[var(--t-radius)] border border-t-border bg-t-card px-4 py-3 transition hover:border-t-primary hover:shadow-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-4">
                  <Icon name={s.icon ?? undefined} />
                </span>
                <span className="font-heading flex-1 truncate text-lg text-t-fg group-hover:text-t-primary">{t(s.name as LocalizedString, lang)}</span>
                <ArrowRight className="size-4 text-t-muted-fg transition group-hover:translate-x-0.5 group-hover:text-t-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
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
        practiceAreas: () => <CompactPracticeAreas ctx={ctx} />,
        about: () => <CredentialsTimeline ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-bg" />,
        team: () => <TeamBlock ctx={ctx} variant="wide" take={2} showSpecialties className="bg-t-muted" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="consultation" subjectOptions={PRACTICE_SUBJECTS} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
