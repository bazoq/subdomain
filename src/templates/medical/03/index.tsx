/**
 * medical-03 "MediDash" (#1503) — Fast-delivery, app-style pharmacy.
 * Brief: compact search-first header (sticky big search row, "Deliver to" chip, prescription upload, cart); hero as
 * an app-style search card with a delivery ETA badge and live category chips; collections as a snap-scroll row;
 * prescription block as a floating elevated card; features as delivery-time steps; mobile-first red cards.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, FileHeart, MapPin, Pill, Search, Timer } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection, prescriptionCtaSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, CategoryChips, EcommerceProviders, ProductGrid, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getCategories, getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

const DELIVER_TO = ls("Deliver to", "ڈیلیوری");

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

function SearchForm({ ctx, id, className }: { ctx: SiteContext; id: string; className?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("flex items-center gap-2", className)}>
      <label className="relative flex-1">
        <span className="sr-only">{t(ui.search, ctx.lang)}</span>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-t-muted-fg" aria-hidden="true" />
        <input id={id} type="search" name="q" placeholder={t(sui.searchPlaceholder, ctx.lang)} className="t-input h-12 w-full rounded-full ps-12 text-base" maxLength={80} />
      </label>
      <button type="submit" className="t-btn t-btn-primary h-12 shrink-0 rounded-full px-5 font-bold">
        {t(ui.search, ctx.lang)}
      </button>
    </form>
  );
}

/* ---------- Layout: compact, search-first ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const city = ctx.settings.contact.city;
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <div className="sticky top-0 z-50 bg-t-bg/95 backdrop-blur">
          <SiteHeader
            ctx={ctx}
            variant="light"
            sticky={false}
            cta={null}
            className="border-b-0 bg-transparent backdrop-blur-none [&>div]:h-14 lg:[&>div]:h-16 [&_nav_a]:rounded-full [&_nav_a]:text-sm [&_nav_a]:font-semibold"
            rightSlot={
              <>
                {city ? (
                  <span className="hidden items-center gap-1.5 rounded-full bg-t-muted px-3 py-1.5 text-xs font-semibold sm:inline-flex">
                    <MapPin className="size-3.5 text-t-primary" aria-hidden="true" />
                    <span className="text-t-muted-fg">{t(DELIVER_TO, ctx.lang)}:</span> {city}
                  </span>
                ) : null}
                <CartButton ctx={lc} mode="drawer" />
              </>
            }
          />
          <div className="border-b border-t-border">
            <Container className="flex items-center gap-2 pb-3">
              <SearchForm ctx={ctx} id="medidash-q-top" className="flex-1" />
              <Link href="/upload-prescription" className="t-btn t-btn-outline hidden h-12 shrink-0 rounded-full px-4 font-bold text-t-primary sm:inline-flex">
                <FileHeart className="size-4" /> {t(ui.uploadPrescription, ctx.lang)}
              </Link>
            </Container>
          </div>
        </div>
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: app-style search card ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const categories = await getCategories(ctx.tenant.id);
  const eta = h.badges?.[0];
  return (
    <section className="relative overflow-hidden bg-t-muted py-8 sm:py-12">
      <Container>
        <div className="relative overflow-hidden rounded-[1.5rem] bg-t-secondary p-6 text-t-secondary-fg sm:p-10">
          {h.image ? <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-t-secondary via-t-secondary/85 to-t-secondary/40 rtl:bg-gradient-to-l" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {h.eyebrow ? <span className="inline-flex items-center gap-1.5 rounded-full bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-primary-fg">{h.eyebrow}</span> : null}
              {eta ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-t-accent px-3 py-1 text-xs font-bold text-t-accent-fg">
                  <span className="[&_svg]:size-3.5">
                    <Icon name={eta.icon} />
                  </span>
                  {eta.text}
                </span>
              ) : null}
            </div>
            <h1 className="font-heading mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{t(h.title, lang)}</h1>
            <p className="mt-3 max-w-xl text-base leading-7 opacity-85">{t(h.subtitle, lang)}</p>
            <div className="mt-6 rounded-full bg-t-card p-1.5 shadow-lg">
              <SearchForm ctx={ctx} id="medidash-q-hero" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full border border-t-secondary-fg/40 bg-t-secondary-fg/10 font-bold text-t-secondary-fg hover:bg-t-secondary-fg/20" />
            </div>
          </div>
        </div>
        {categories.length ? <CategoryChips categories={categories} ctx={{ lang }} className="mt-6" /> : null}
      </Container>
    </section>
  );
}

/* ---------- Collections: snap-scroll row ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-12 sm:py-14">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" />
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i} className="w-40 shrink-0 snap-start sm:w-48">
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-t-border bg-t-card transition hover:shadow-md">
                  <Img src={it.image} alt="" className="aspect-square w-full bg-t-muted object-cover" fallback={<Pill className="size-9 text-t-primary/40" />} />
                  <div className="p-3.5">
                    <h3 className="font-heading text-sm font-bold group-hover:text-t-primary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-0.5 text-xs text-t-muted-fg">{sub}</p> : null}
                  </div>
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d.mode, d.count);
  if (!products.length) return null;
  return (
    <section id="products" className="bg-t-muted py-12 sm:py-16">
      <Container>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full font-bold text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:rounded-[1.25rem]" />
      </Container>
    </section>
  );
}

/* ---------- Prescription CTA: floating elevated card ---------- */
function FloatingPrescription({ ctx }: TemplatePageProps) {
  const d = section(ctx, prescriptionCtaSection);
  if (!d) return null;
  const lang = ctx.lang;
  const points = d.points ?? [];
  return (
    <section id="prescription" className="relative z-10 -my-2 py-10 sm:py-12">
      <Container>
        <div className="flex flex-col gap-7 rounded-[1.5rem] border border-t-border bg-t-card p-6 shadow-2xl sm:p-10 lg:flex-row lg:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-t-primary text-t-primary-fg">
            <FileHeart className="size-7" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">{t(d.title, lang)}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-t-muted-fg sm:text-base">{t(d.text, lang)}</p>
            {points.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {points.map((p, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-t-muted px-3 py-1.5 text-xs font-semibold">
                    <Clock className="size-3.5 text-t-accent" aria-hidden="true" /> {t(p.text, lang)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="shrink-0">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-12 sm:py-16">
      <Container>
        <div className={cn("grid items-center overflow-hidden rounded-[1.5rem] bg-t-primary text-t-primary-fg lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-7 sm:p-11">
            {d.eyebrow ? <span className="inline-block rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-accent-fg">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-lg opacity-90">{t(d.text, lang)}</p>
            <div className="mt-6">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn rounded-full bg-t-card font-bold text-t-primary hover:opacity-90" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Pill className="size-16 opacity-40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features: delivery-time steps ---------- */
function DeliverySteps({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="border-y border-t-border bg-t-muted py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ol className={cn("grid gap-5", d.items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <li key={i} className="relative flex h-full flex-col rounded-[1.25rem] bg-t-card p-6 shadow-sm">
              <span className="absolute end-5 top-5 flex items-center gap-1 text-xs font-bold text-t-accent">
                <Timer className="size-3.5" aria-hidden="true" /> {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex size-12 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-6">
                <Icon name={it.icon} />
              </span>
              <h3 className="font-heading mt-4 text-lg font-extrabold">{t(it.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-t-muted-fg">{t(it.text, lang)}</p>
            </li>
          ))}
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        prescriptionCta: () => <FloatingPrescription ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <DeliverySteps ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="[&_img]:rounded-[1.5rem]" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-12" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted [&_figure]:rounded-[1.25rem]" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-muted [&>div>div]:rounded-[1.5rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
