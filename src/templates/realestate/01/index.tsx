/**
 * realestate-01 "Estate Prime" (#1601)
 * Classic navy & gold property agency. White header with gold "List your property",
 * full-bleed skyline hero with a PropertySearch card, featured listings grid with purpose
 * badges, areas as photo tiles, agents row. Serif headings, classic grid.
 */
import * as React from "react";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { areasSection, featuredPropertiesSection, servicesSection } from "@/templates/shared/packs";
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
  ProcessBlock,
  ServicesBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TeamBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { FeaturedProperties, PropertySearch } from "@/modules/realestate/ui";
import { getPropertyCities } from "@/modules/realestate/queries";

type FeaturedData = HeadingData & { count?: number; cta?: LinkData };
type AreasData = HeadingData & { items: { name: string; image: string; href: string; note: string }[] };
type ServicesHeading = HeadingData & { count?: number };

/* ---------- Layout: white header, gold list-your-property, dark footer ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const hero = section(ctx, heroSection);
  const list = hero?.secondaryCta;
  const listLabel = t(list?.label, ctx.lang);
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar ctx={ctx} variant="dark" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={null}
        className="[&>div>a>span]:text-t-primary"
        rightSlot={
          list && listLabel ? (
            <SmartLink href={list.href || "/contact"} ctx={ctx} className="t-btn t-btn-accent hidden px-4 py-2.5 text-sm md:inline-flex">
              {listLabel}
            </SmartLink>
          ) : null
        }
      />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Hero: skyline photo + search card ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const cities = await getPropertyCities(ctx.tenant.id);
  return (
    <section className="relative isolate overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={h.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-t-dark/70 via-t-dark/60 to-t-dark" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-1 bg-t-accent" aria-hidden="true" />
      <Container className="pb-10 pt-20 lg:pt-28">
        <div className="t-fade-up mx-auto max-w-3xl text-center">
          {h.eyebrow ? <span className="inline-block border-b border-t-accent pb-1 text-xs font-bold uppercase tracking-[0.3em] text-t-accent">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-t-dark-fg/80">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline border-white/40 text-t-dark-fg hover:bg-white/10" />
          </div>
        </div>
        <div className="t-fade-up mt-12 text-t-fg [animation-delay:150ms]">
          <PropertySearch ctx={ctx} cities={cities} />
        </div>
        {h.badges?.length ? (
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-dark-fg/85">
                <span className="text-t-accent [&_svg]:size-4">
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

/* ---------- Signature: areas as photo tiles ---------- */
function AreaTiles({ ctx }: TemplatePageProps) {
  const d = sectionData<AreasData>(ctx, areasSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="areas" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={ctx.lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((a, i) => (
            <li key={i} className={cn(i === 0 && d.items.length > 3 && "sm:col-span-2 lg:col-span-2")}>
              <SmartLink href={a.href || "/properties"} ctx={ctx} className="group relative block overflow-hidden rounded-[var(--t-radius)] bg-t-dark text-t-dark-fg shadow-sm">
                <Img src={a.image} alt={a.name} className="aspect-[4/3] w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" fallback={<Building2 className="size-12 opacity-30" />} />
                <div className="absolute inset-0 bg-gradient-to-t from-t-dark/90 via-t-dark/30 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-heading text-xl font-bold">{a.name}</h3>
                    {a.note ? (
                      <p className="mt-1 flex items-center gap-1 text-sm text-t-dark-fg/75">
                        <MapPin className="size-3.5 text-t-accent" /> {a.note}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-t-accent text-t-accent-fg transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </span>
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
  const featured = sectionData<FeaturedData>(ctx, featuredPropertiesSection);
  const services = sectionData<ServicesHeading>(ctx, servicesSection);
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredProperties: () =>
          featured ? <FeaturedProperties ctx={ctx} take={featured.count ?? 6} eyebrow={featured.eyebrow} title={featured.title} subtitle={featured.subtitle} className="bg-t-bg" /> : null,
        areas: () => <AreaTiles ctx={ctx} />,
        services: () => (services ? <ServicesBlock ctx={ctx} variant="icon" columns={3} take={services.count ?? 6} heading={services} showPrice={false} /> : null),
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="border-t border-t-border" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="border-t-4 border-t-accent" />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        team: () => <TeamBlock ctx={ctx} variant="circle" columns={4} showSpecialties={false} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Buy", "Sell", "Rent", "Valuation", "Other"]} />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
