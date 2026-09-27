/**
 * travel-02 "Noor Umrah" (#802)
 * Umrah & Hajj specialist, emerald & gold. Emerald header with gold serif logo, Haram photo
 * hero with dark gradient, gold headline, tier chips and group departure dates strip.
 * Geometric pattern dividers (CSS), Umrah highlights icon list, pilgrim testimonials.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Moon } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
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
  FeaturesBlock,
  GalleryBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
} from "@/modules/shared/ui";
import { FeaturedPackages, UmrahHighlights, parseDepartures } from "@/modules/travel/ui";
import { getFeaturedPackages } from "@/modules/travel/queries";

const TIERS: { key: string; en: string; ur: string }[] = [
  { key: "economy", en: "Economy", ur: "اکانومی" },
  { key: "standard", en: "Standard", ur: "اسٹینڈرڈ" },
  { key: "premium", en: "Premium", ur: "پریمیم" },
];

/* ---------- Geometric divider (pure CSS, theme tokens) ---------- */
function GeoDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 w-full opacity-70", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, var(--t-accent) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, var(--t-accent) 0 2px, transparent 2px 12px)",
      }}
    />
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader
        ctx={ctx}
        variant="dark"
        cta={{ label: { en: "Umrah packages", ur: "عمرہ پیکجز" }, href: "/packages?kind=UMRAH" }}
        className="[&_a>span.font-heading]:text-t-accent [&_a.t-btn]:bg-t-accent [&_a.t-btn]:text-t-accent-fg"
      />
      <GeoDivider className="bg-t-dark" />
      <main id="main" className="flex-1">{children}</main>
      <GeoDivider className="bg-t-dark" />
      <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-accent" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const umrah = await getFeaturedPackages(ctx.tenant.id, 6, "UMRAH");
  const departures = Array.from(new Set(umrah.flatMap((p) => parseDepartures(p.departures, true).slice(0, 2)))).sort().slice(0, 6);
  return (
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Moon className="size-24 opacity-20" />} />
      <div className="absolute inset-0 bg-gradient-to-b from-t-dark/70 via-t-dark/60 to-t-dark" aria-hidden="true" />
      <Container className="relative py-24 text-center lg:py-32">
        {t(h.eyebrow, lang) ? <span className="inline-block border-y border-t-accent/60 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-t-accent">{t(h.eyebrow, lang)}</span> : null}
        <h1 className="font-heading mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight text-t-accent sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-t-dark-fg/85">{t(h.subtitle, lang)}</p>
        {/* tier chips */}
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {TIERS.map((tier) => (
            <li key={tier.key}>
              <Link href={`/packages?kind=UMRAH&q=${tier.key}`} className="inline-flex items-center gap-2 border border-t-accent/60 bg-t-dark-fg/5 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-t-accent transition hover:bg-t-accent hover:text-t-accent-fg">
                {lang === "ur" ? tier.ur : tier.en}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-dark-fg" />
        </div>
        {h.badges?.length ? (
          <ul className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-t-dark-fg/80">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
      {/* group departure dates strip */}
      {departures.length ? (
        <div className="relative border-t border-t-accent/30 bg-t-dark/80 backdrop-blur">
          <Container className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold uppercase tracking-widest text-t-accent">
              <CalendarDays className="size-4" /> {lang === "ur" ? "گروپ روانگیاں" : "Group departures"}
            </span>
            {departures.map((d) => (
              <span key={d} className="text-t-dark-fg/90">
                {new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              </span>
            ))}
          </Container>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Signature: Umrah highlights (custom split + icon list) ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 border border-t-accent/40 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-t-primary">{lang === "ur" ? "عمرہ · حج" : "Umrah · Hajj"}</span>
            <h2 className="font-heading mt-3 text-3xl font-bold sm:text-4xl">{t(u.title, lang)}</h2>
            <p className="mt-4 text-t-muted-fg">{t(u.text, lang)}</p>
            {u.points?.length ? (
              <ul className="mt-6 divide-y divide-t-border border-y border-t-border">
                {u.points.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <span className="flex size-7 shrink-0 items-center justify-center bg-t-accent text-t-accent-fg">
                      <Check className="size-4" />
                    </span>
                    <span className="font-medium">{t(p.text, lang)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="relative p-3">
            <div className="absolute inset-0 border-2 border-t-accent" aria-hidden="true" />
            <Img src={u.image} alt="" className="relative aspect-square w-full object-cover" fallback={<Moon className="size-16 opacity-30" />} />
          </div>
        </div>
      </Container>
      <UmrahHighlights ctx={ctx} showPackages={false} className="pb-0 pt-14 sm:pb-0" />
    </section>
  );
}

/* ---------- Destinations (ornamental list) ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group block border border-t-border bg-t-card p-2 transition hover:border-t-accent">
                <Img src={it.image} alt={t(it.name, ctx.lang)} className="aspect-[4/3] w-full object-cover" />
                <div className="px-2 pb-2 pt-3">
                  <p className="font-heading text-lg font-bold group-hover:text-t-primary">{t(it.name, ctx.lang)}</p>
                  {t(it.note, ctx.lang) ? <p className="text-sm text-t-muted-fg">{t(it.note, ctx.lang)}</p> : null}
                </div>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
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
        umrah: () => <Umrah ctx={ctx} />,
        featuredPackages: () => (fp ? <FeaturedPackages ctx={ctx} take={fp.count || 6} eyebrow={t(fp.eyebrow, ctx.lang)} title={fp.title} className="bg-t-muted" /> : null),
        destinations: () => <Destinations ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} light />,
        services: () => <ServicesBlock ctx={ctx} variant="list" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-muted" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        testimonials: () => (
          <TestimonialsBlock ctx={ctx} variant="grid" heading={{ eyebrow: ctx.lang === "ur" ? "زائرین" : "Pilgrims", title: (ctx.sections.testimonials?.data as { title?: { en: string; ur?: string } } | undefined)?.title }} className="border-y border-t-accent/40" />
        ),
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:text-t-accent" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Umrah", "Hajj", "Ziyarat", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
