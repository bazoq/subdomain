/**
 * sports-04 "Summit Gear" (#1004) — Outdoor, trekking and camping store.
 * Brief: sand header with a green logotype, a mountain-marked info strip above it and nav that turns green on hover;
 * full-bleed mountain photo hero with a dark gradient and a tick-list of gear badges; collections as wide landscape
 * tiles; features strung along a dashed trail; earthy sand surfaces, green CTAs, orange highlights.
 */
import * as React from "react";
import { ArrowRight, Check, Compass, Mountain, Phone, Tent } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, BrandsMarquee, CtaBlock, FaqBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const city = ctx.settings.contact.city;
  const phone = ctx.settings.contact.phone;
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        {city || phone ? (
          <div className="border-b border-t-border bg-t-muted">
            <Container className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2 text-xs font-medium text-t-muted-fg">
              {city ? (
                <span className="flex items-center gap-1.5">
                  <Mountain className="size-3.5 text-t-primary" aria-hidden="true" /> {city}
                </span>
              ) : null}
              {phone ? (
                <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-t-primary">
                  <Phone className="size-3.5 text-t-primary" aria-hidden="true" /> {phone}
                </a>
              ) : null}
            </Container>
          </div>
        ) : null}
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="bg-t-muted/95 [&>div>a>span]:text-t-primary [&_nav_a]:font-semibold [&_nav_a:hover]:bg-t-primary/10 [&_nav_a:hover]:text-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="hover:bg-t-primary/10" />}
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: full-bleed mountain photo + gear tick-list ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative isolate overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={h.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" fallback={<Mountain className="size-24 text-t-primary/30" />} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-t-dark via-t-dark/70 to-t-dark/20" aria-hidden="true" />
      <Container className="py-24 lg:py-36">
        <div className="max-w-2xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-[var(--t-radius)] border border-t-dark-fg/30 bg-t-dark-fg/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur">
              <Compass className="size-4 text-t-accent" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-dark-fg/85">{t(h.subtitle, lang)}</p>
          {h.badges?.length ? (
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold">
                  <span className="flex size-6 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline border-t-dark-fg/40 text-t-dark-fg hover:bg-t-dark-fg/10" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: wide landscape tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" />
        <ul className="space-y-5">
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group relative block overflow-hidden rounded-[var(--t-radius)] bg-t-dark">
                  <Img
                    src={it.image}
                    alt=""
                    className="h-56 w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-90 sm:h-64"
                    fallback={<Tent className="size-12 text-t-primary/40" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-t-dark/85 via-t-dark/40 to-transparent rtl:bg-gradient-to-l" aria-hidden="true" />
                  <div className="absolute inset-y-0 start-0 flex max-w-lg flex-col justify-center p-7 text-t-dark-fg sm:p-10">
                    {sub ? <span className="text-xs font-bold uppercase tracking-[0.2em] text-t-accent">{sub}</span> : null}
                    <h3 className="font-heading mt-2 text-2xl font-extrabold sm:text-3xl">{t(it.title, lang)}</h3>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-t-dark-fg/90">
                      {t(ui.shop, lang)} <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
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
    <section id="products" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} />
      </Container>
    </section>
  );
}

/* ---------- Banner: sand frame split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-center gap-0 overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {d.eyebrow ? <span className="inline-block rounded-[var(--t-radius)] bg-t-accent px-2.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-accent-fg">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Mountain className="size-16 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features: dashed trail ---------- */
function TrailFeatures({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ul className={cn("relative grid gap-10", d.items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          <span className="absolute inset-x-8 top-8 hidden border-t-2 border-dashed border-t-primary/40 lg:block" aria-hidden="true" />
          {d.items.map((it, i) => (
            <li key={i} className="relative text-center">
              <span className="relative mx-auto flex size-16 items-center justify-center rounded-full border-2 border-t-primary bg-t-bg text-t-primary [&_svg]:size-7">
                <Icon name={it.icon} />
              </span>
              <h3 className="font-heading mt-5 text-lg font-extrabold">{t(it.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-t-muted-fg">{t(it.text, lang)}</p>
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <TrailFeatures ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted" />,
        brands: () => <BrandsMarquee ctx={ctx} speed="slow" className="bg-t-bg" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-y border-t-border bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
