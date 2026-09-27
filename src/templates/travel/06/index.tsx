/**
 * travel-06 "Family Trips" (#806)
 * Friendly family holidays, teal & coral. Teal rounded header, playful logo, coral CTA.
 * Illustrated-feel hero with rounded photo blobs, headline and trust badges. Destinations as
 * circular tiles; process as bubbles; testimonials with family photos. Rounded, pastel bands.
 */
import * as React from "react";
import { ArrowRight, Check, Smile, Sun } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, processSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedPackages, UmrahHighlights } from "@/modules/travel/ui";

/* ---------- Layout: teal rounded header, coral CTA ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <div className="sticky top-0 z-50 px-2 pt-2 sm:px-4">
        <SiteHeader
          ctx={ctx}
          variant="dark"
          sticky={false}
          cta={{ label: { en: "Plan a family trip", ur: "فیملی ٹرپ پلان کریں" }, href: "/contact" }}
          className="rounded-[calc(var(--t-radius)*1.5)] bg-t-primary text-t-primary-fg shadow-lg [&_a.t-btn]:rounded-full [&_a.t-btn]:bg-t-accent [&_a.t-btn]:text-t-accent-fg [&_nav>a]:rounded-full"
        />
      </div>
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="primary" className="mt-6 rounded-t-[calc(var(--t-radius)*2)]" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: rounded photo blobs ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const pics = [h.image, ...(h.slides ?? [])].filter(Boolean).slice(0, 3);
  while (pics.length < 3) pics.push("");
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -start-20 top-10 size-72 rounded-full bg-t-muted" aria-hidden="true" />
      <div className="pointer-events-none absolute -end-16 bottom-0 size-56 rounded-full bg-t-accent/15" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent/15 px-4 py-1.5 text-sm font-bold text-t-accent">
              <Sun className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.05] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-3">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 rounded-full border-2 border-dashed border-t-primary/40 bg-t-card px-4 py-2 text-sm font-semibold text-t-primary">
                  <Icon name={b.icon} className="size-4" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
          <Img src={pics[0]} alt="" className="col-span-2 aspect-[5/4] w-full object-cover [border-radius:45%_55%_50%_50%/55%_45%_55%_45%]" fallback={<Smile className="size-14 opacity-30" />} />
          <Img src={pics[1]} alt="" className="aspect-square w-full object-cover [border-radius:60%_40%_50%_50%/50%_60%_40%_50%]" fallback={<Sun className="size-10 opacity-30" />} />
          <Img src={pics[2]} alt="" className="aspect-square w-full object-cover [border-radius:40%_60%_60%_40%/55%_45%_55%_45%]" fallback={<Smile className="size-10 opacity-30" />} />
          <span className="absolute -end-3 top-6 flex size-16 rotate-12 items-center justify-center rounded-full bg-t-accent text-t-accent-fg shadow-lg" aria-hidden="true">
            <Smile className="size-8" />
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: circular destination tiles ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="flex flex-wrap justify-center gap-8">
          {d.items.map((it, i) => (
            <li key={i} className="w-40 sm:w-48">
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group block text-center">
                <div className="mx-auto size-36 overflow-hidden rounded-full border-4 border-t-muted shadow-md transition group-hover:border-t-accent sm:size-44">
                  <Img src={it.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <p className="font-heading mt-4 text-lg font-bold text-t-fg group-hover:text-t-primary">{t(it.name, ctx.lang)}</p>
                {t(it.note, ctx.lang) ? <p className="text-xs font-semibold text-t-accent">{t(it.note, ctx.lang)}</p> : null}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: process bubbles ---------- */
function Bubbles({ ctx }: TemplatePageProps) {
  const p = section(ctx, processSection);
  if (!p || !p.steps?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="process" className="py-16 sm:py-20">
      <Container>
        <div className="rounded-[calc(var(--t-radius)*2)] bg-t-muted px-6 py-12 sm:px-12">
          <SectionHeading eyebrow={p.eyebrow} title={p.title} lang={lang} />
          <ol className="grid gap-8 sm:grid-cols-3">
            {p.steps.map((s, i) => (
              <li key={i} className="relative rounded-[calc(var(--t-radius)*2)] bg-t-card p-6 pt-10 text-center shadow-sm">
                <span className="absolute -top-6 start-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-t-accent font-heading text-lg font-extrabold text-t-accent-fg shadow-md rtl:translate-x-1/2">{i + 1}</span>
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-7">
                  <Icon name={s.icon} />
                </span>
                <h3 className="font-heading mt-4 text-xl font-bold">{t(s.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(s.text, lang)}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Umrah: soft band ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 rounded-[calc(var(--t-radius)*2)] bg-t-primary p-8 text-t-primary-fg sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">{t(u.title, lang)}</h2>
            <p className="mt-4 text-t-primary-fg/85">{t(u.text, lang)}</p>
            {u.points?.length ? (
              <ul className="mt-6 space-y-2">
                {u.points.map((pt, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                      <Check className="size-3.5" />
                    </span>
                    {t(pt.text, lang)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full" />
            </div>
          </div>
          <Img src={u.image} alt="" className="aspect-[4/3] w-full rounded-[calc(var(--t-radius)*2)] object-cover" fallback={<Icon name="Moon" className="size-14 opacity-40" />} />
        </div>
      </Container>
      <UmrahHighlights ctx={ctx} showPackages={false} className="pb-0 pt-14 sm:pb-0 [&_li]:rounded-[calc(var(--t-radius)*1.5)]" />
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredPackages: () => (fp ? <FeaturedPackages ctx={ctx} take={fp.count || 6} eyebrow={t(fp.eyebrow, ctx.lang)} title={fp.title} className="bg-t-muted [&_article]:rounded-[calc(var(--t-radius)*1.5)]" /> : null),
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        services: () => <ServicesBlock ctx={ctx} variant="icon" columns={3} className="bg-t-muted" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:rounded-[calc(var(--t-radius)*1.5)]" />,
        process: () => <Bubbles ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-accent/10 [&_dd]:text-t-accent" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Family holiday", "School trip", "Group tour", "Umrah", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
