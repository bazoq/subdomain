/**
 * travel-10 "Corporate Travel Co." (#810)
 * Business travel, grey & blue, formal. Grey header with blue logo and "Request corporate
 * account". Split hero with headline, stats row and a "trusted by" badge strip. Services as
 * formal table-like cards; contact CTA for corporate accounts. Formal grid, restrained
 * colour, sharp corners.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Check } from "lucide-react";
import type { Service } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { asLocalizedList } from "@/modules/shared/content-types";
import type { HeadingData } from "@/modules/shared/ui/section-types";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  ProcessBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
  servicePriceLabel,
} from "@/modules/shared/ui";
import { FeaturedPackages, UmrahHighlights } from "@/modules/travel/ui";

/* ---------- Layout: grey header, blue logo ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: { en: "Request corporate account", ur: "کارپوریٹ اکاؤنٹ کی درخواست" }, href: "/contact" }}
        className="bg-t-muted/95 [&_a>span.font-heading]:text-t-primary"
      />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: split with stats row + trusted-by strip ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="border-b border-t-border bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 border-s-4 border-t-primary ps-3 text-xs font-bold uppercase tracking-[0.2em] text-t-primary">
              <Briefcase className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          <StatsBlock ctx={ctx} variant="row" bare className="mt-12 border-t border-t-border pt-8 [&_dd]:text-2xl sm:[&_dd]:text-3xl [&_dl]:gap-4 [&_dl>div]:text-start" />
        </div>
        <div className="relative">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/3] w-full object-cover" fallback={<Building2 className="size-16 opacity-30" />} />
          <div className="absolute -bottom-6 -start-6 hidden border border-t-border bg-t-card p-5 shadow-lg md:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-muted-fg">{lang === "ur" ? "کارپوریٹ ڈیسک" : "Corporate desk"}</p>
            {ctx.settings.contact.phone ? (
              <a href={`tel:${ctx.settings.contact.phone}`} dir="ltr" className="font-heading mt-1 block text-lg font-semibold text-t-primary">
                {ctx.settings.contact.phone}
              </a>
            ) : ctx.settings.contact.email ? (
              <a href={`mailto:${ctx.settings.contact.email}`} className="font-heading mt-1 block text-lg font-semibold text-t-primary">
                {ctx.settings.contact.email}
              </a>
            ) : null}
          </div>
        </div>
      </Container>
      {h.badges?.length ? (
        <div className="border-t border-t-border bg-t-muted">
          <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-t-muted-fg">
            {h.badges.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
              </span>
            ))}
          </Container>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Signature: services as table-like cards ---------- */
function ServiceRow({ s, ctx, index }: { s: Service; ctx: TemplatePageProps["ctx"]; index: number }) {
  const lang = ctx.lang;
  const feats = asLocalizedList(s.features).slice(0, 4);
  const price = servicePriceLabel(s, lang);
  return (
    <Link href={`/services/${s.slug}`} className="group grid gap-4 border-b border-t-border p-6 transition hover:bg-t-muted md:grid-cols-[3rem_1.2fr_1.5fr_auto] md:items-center">
      <span className="font-heading text-sm font-semibold text-t-muted-fg">{String(index + 1).padStart(2, "0")}</span>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center bg-t-primary/10 text-t-primary [&_svg]:size-5">
          <Icon name={s.icon ?? undefined} />
        </span>
        <div>
          <h3 className="font-heading font-semibold group-hover:text-t-primary">{t(s.name as LocalizedString, lang)}</h3>
          <p className="line-clamp-1 text-sm text-t-muted-fg md:hidden">{t(s.summary as LocalizedString, lang)}</p>
        </div>
      </div>
      <div className="text-sm text-t-muted-fg">
        <p className="hidden line-clamp-2 md:block">{t(s.summary as LocalizedString, lang)}</p>
        {feats.length ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {feats.map((f, i) => (
              <li key={i} className="flex items-center gap-1">
                <Check className="size-3 text-t-accent" /> {t(f, lang)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <span className="flex items-center justify-between gap-4 text-sm font-semibold text-t-primary md:justify-end">
        {price || t(ui.readMore, lang)}
        <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180" />
      </span>
    </Link>
  );
}

async function Services({ ctx }: TemplatePageProps) {
  const h = ctx.sections.services?.data as (HeadingData & { count?: number }) | undefined;
  const rows = await getServices(ctx.tenant.id, { take: h?.count || 9 });
  if (!rows.length) return null;
  return (
    <section id="services" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={h?.eyebrow} title={h?.title ?? ui.services} subtitle={h?.subtitle} align="left" lang={ctx.lang} />
        <div className="border border-t-border bg-t-card">
          <div className="hidden grid-cols-[3rem_1.2fr_1.5fr_auto] gap-4 border-b border-t-border bg-t-muted px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-t-muted-fg md:grid">
            <span>#</span>
            <span>{t(ui.services, ctx.lang)}</span>
            <span>{ctx.lang === "ur" ? "تفصیل" : "Scope"}</span>
            <span className="text-end">{ctx.lang === "ur" ? "قیمت" : "Pricing"}</span>
          </div>
          {rows.map((s, i) => (
            <ServiceRow key={s.id} s={s} ctx={ctx} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Destinations: compact grid ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={ctx.lang} />
        <ul className="grid gap-px border border-t-border bg-t-border sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i} className="bg-t-card">
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group block p-4 transition hover:bg-t-muted">
                <Img src={it.image} alt="" className="aspect-[16/10] w-full object-cover" />
                <p className="font-heading mt-3 font-semibold group-hover:text-t-primary">{t(it.name, ctx.lang)}</p>
                {t(it.note, ctx.lang) ? <p className="text-xs text-t-muted-fg">{t(it.note, ctx.lang)}</p> : null}
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Umrah ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 border border-t-border p-6 sm:p-10 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl">{t(u.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(u.text, lang)}</p>
          {u.points?.length ? (
            <ul className="mt-6 divide-y divide-t-border border-y border-t-border text-sm">
              {u.points.map((p, i) => (
                <li key={i} className="flex items-center gap-2 py-2.5">
                  <Check className="size-4 text-t-accent" /> {t(p.text, lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-primary" />
          </div>
        </div>
        <Img src={u.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Icon name="Moon" className="size-14 opacity-30" />} />
      </Container>
      <UmrahHighlights ctx={ctx} showPackages={false} className="pb-0 pt-14 sm:pb-0" />
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
        featuredPackages: () => (fp ? <FeaturedPackages ctx={ctx} take={fp.count || 6} eyebrow={t(fp.eyebrow, ctx.lang)} title={fp.title} className="bg-t-muted" /> : null),
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        services: () => <Services ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Corporate account", "Group booking", "MICE / events", "Ticketing", "Hotels", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
