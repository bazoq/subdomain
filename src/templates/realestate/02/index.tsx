/**
 * realestate-02 "Urban Nest" (#1602)
 * Modern minimal black & white with a green accent for apartments and rentals.
 * Minimal header with a Buy/Rent toggle and search icon, search-first centred hero with
 * a small headline and key stats, large-photo minimal property cards, areas as a text
 * list with counts. Rounded-lg, generous whitespace.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, statsSection } from "@/templates/shared/sections";
import { areasSection, featuredPropertiesSection, servicesSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData, LinkData, StatsData } from "@/modules/shared/ui/section-types";
import { PropertySearch, propertyPrice, purposeLabel, realestateStrings as rs, typeLabel } from "@/modules/realestate/ui";
import { getFeaturedProperties, getPropertyCities } from "@/modules/realestate/queries";

type FeaturedData = HeadingData & { count?: number; cta?: LinkData };
type AreasData = HeadingData & { items: { name: string; image: string; href: string; note: string }[] };
type ServicesHeading = HeadingData & { count?: number };

/* ---------- Layout: minimal header with Rent / Buy toggle + search icon ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lang = ctx.lang;
  const toggle = (
    <div className="flex items-center gap-2">
      <div className="hidden overflow-hidden rounded-full border border-t-border text-xs font-semibold sm:flex" role="group" aria-label={t(rs.purpose, lang)}>
        <Link href="/properties?purpose=SALE" className="px-3 py-1.5 transition hover:bg-t-muted hover:text-t-primary">
          {t(rs.buy, lang)}
        </Link>
        <Link href="/properties?purpose=RENT" className="border-s border-t-border px-3 py-1.5 transition hover:bg-t-muted hover:text-t-primary">
          {t(rs.rent, lang)}
        </Link>
      </div>
      <Link href="/properties" aria-label={t(rs.search, lang)} className="flex size-10 items-center justify-center rounded-full transition hover:bg-t-muted">
        <Search className="size-5" />
      </Link>
    </div>
  );
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="accent" />
      <SiteHeader ctx={ctx} variant="light" cta={null} rightSlot={toggle} className="border-b-0 [&>div>a>span]:tracking-tighter" />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="light" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: search-first, small headline, key stats ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const [cities, stats] = [await getPropertyCities(ctx.tenant.id), sectionData<StatsData>(ctx, statsSection)];
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <Container className="pb-14 pt-10 sm:pt-16 lg:pb-20">
        <div className="t-fade-up mx-auto max-w-2xl text-center">
          {h.eyebrow ? <span className="inline-flex items-center gap-2 rounded-full bg-t-muted px-3 py-1 text-xs font-semibold text-t-muted-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-4 text-3xl font-extrabold tracking-tight text-t-fg sm:text-4xl">{t(h.title, lang)}</h1>
          <p className="mt-3 text-base text-t-muted-fg sm:text-lg">{t(h.subtitle, lang)}</p>
        </div>
        <div className="t-fade-up mx-auto mt-8 max-w-5xl [animation-delay:120ms]">
          <PropertySearch ctx={ctx} cities={cities} className="rounded-[var(--t-radius)] shadow-xl shadow-t-fg/5" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-ghost text-t-fg" icon={<ArrowUpRight className="size-4 rtl:-scale-x-100" />} />
        </div>
        {stats?.items?.length ? (
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {stats.items.slice(0, 4).map((s, i) => (
              <div key={i}>
                <dd className="font-heading text-2xl font-extrabold tracking-tight text-t-fg sm:text-3xl">{s.value}</dd>
                <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-t-muted-fg">{t(s.label, lang)}</dt>
              </div>
            ))}
          </dl>
        ) : null}
        {h.image ? (
          <div className="mt-12 overflow-hidden rounded-[var(--t-radius)]">
            <Img src={h.image} alt="" className="aspect-[21/9] w-full object-cover" />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Signature: large-photo minimal property cards ---------- */
async function MinimalListings({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredPropertiesSection);
  if (!d) return null;
  const items = await getFeaturedProperties(ctx.tenant.id, d.count ?? 6);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="properties" className="py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={lang} className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="inline-flex items-center gap-1 text-sm font-semibold text-t-fg underline-offset-4 hover:text-t-accent hover:underline" icon={<ArrowUpRight className="size-4 rtl:-scale-x-100" />} />
        </div>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const title = t(p.title as LocalizedString, lang);
            return (
              <li key={p.id} className="group relative">
                <div className="relative overflow-hidden rounded-[var(--t-radius)] bg-t-muted">
                  <Img src={p.images[0]} alt={title} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                  <span className={cn("absolute start-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", p.purpose === "RENT" ? "bg-t-accent text-t-accent-fg" : "bg-t-primary text-t-primary-fg")}>{purposeLabel(p.purpose, lang)}</span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading truncate text-lg font-bold text-t-fg">
                      <Link href={`/properties/${p.slug}`} className="after:absolute after:inset-0">
                        {title}
                      </Link>
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-t-muted-fg">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {p.location}, {p.city}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{typeLabel(p.type, lang)}</span>
                    </p>
                  </div>
                  <p className="font-heading shrink-0 text-base font-extrabold text-t-fg">{propertyPrice(p, lang)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Signature: areas as a text list with counts ---------- */
async function AreaList({ ctx }: TemplatePageProps) {
  const d = sectionData<AreasData>(ctx, areasSection);
  if (!d || !d.items?.length) return null;
  const cities = await getPropertyCities(ctx.tenant.id);
  const countFor = (name: string) => cities.find((c) => name.toLowerCase().includes(c.value.toLowerCase()) || c.value.toLowerCase().includes(name.toLowerCase()))?.count;
  return (
    <section id="areas" className="border-t border-t-border py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-3">
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} align="left" lang={ctx.lang} className="mb-0" />
        <ul className="divide-y divide-t-border lg:col-span-2">
          {d.items.map((a, i) => {
            const n = countFor(a.name);
            return (
              <li key={i}>
                <SmartLink href={a.href || "/properties"} ctx={ctx} className="group flex items-center gap-4 py-4 transition hover:text-t-accent">
                  <span className="font-heading w-8 text-sm font-bold text-t-muted-fg">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-heading flex-1 text-xl font-bold">{a.name}</span>
                  {a.note ? <span className="hidden text-sm text-t-muted-fg sm:block">{a.note}</span> : null}
                  {n ? <span className="rounded-full bg-t-muted px-2.5 py-0.5 text-xs font-semibold text-t-fg">{n}</span> : null}
                  <ArrowUpRight className="size-5 text-t-muted-fg transition group-hover:text-t-accent rtl:-scale-x-100" />
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const services = sectionData<ServicesHeading>(ctx, servicesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredProperties: () => <MinimalListings ctx={ctx} />,
        areas: () => <AreaList ctx={ctx} />,
        services: () => (services ? <ServicesBlock ctx={ctx} variant="list" take={services.count ?? 6} heading={services} showPrice={false} className="bg-t-muted" /> : null),
        features: () => <FeaturesBlock ctx={ctx} variant="list" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} showSpecialties={false} className="bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" columns={2} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Rent", "Buy", "List a property", "Other"]} showHours={false} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
