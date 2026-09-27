/**
 * kitchen-02 "ChefLine" (#102) — Bold, high-energy appliance store.
 * Brief: two-tier retail header (utility bar with phone/WhatsApp, main bar with a big search field and cart,
 * category mega-strip below); full-width promo slider built from hero.slides with side deal tiles; yellow
 * coupon ribbon; dense product grid with red price tags and an always-visible Add button; compact retail
 * rhythm, thick section dividers, dark footer band with COD/payment badges.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, Banknote, ChevronRight, Flame, ShieldCheck, Truck, Zap } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, promoSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, SiteFooter, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData, PromoData } from "@/modules/shared/ui/section-types";
import { CartDrawer, EcommerceProviders, ProductGrid } from "@/modules/ecommerce/ui";
import { getCategories, getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import type { ProductDTO } from "@/modules/ecommerce/types";
import { RetailHeader } from "./header";

const SLIDE = ls("Slide", "سلائیڈ");

/* ---------- ecommerce pack section shapes ---------- */
type CollectionItem = { title: LocalizedString; subtitle?: LocalizedString; image?: string; href: string };
type CollectionsData = HeadingData & { items?: CollectionItem[] };
type FeaturedData = HeadingData & { mode?: string; count?: number; cta?: LinkData };
type BannerData = HeadingData & { text?: LocalizedString; image?: string; cta?: LinkData; align?: string };

async function loadProducts(ctx: SiteContext, d: FeaturedData): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Number(d.count) || 8));
  if (d.mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* ---------- Layout ---------- */
async function Layout({ ctx, children }: TemplateLayoutProps) {
  const cats = await getCategories(ctx.tenant.id);
  const fromDb = cats.map((c) => ({ label: t(c.name, ctx.lang), href: `/shop/c/${c.slug}` }));
  const fromSection = (sectionData<CollectionsData>(ctx, collectionsSection)?.items ?? []).map((c) => ({ label: t(c.title, ctx.lang), href: c.href || "/shop" }));
  const categories = (fromDb.length ? fromDb : fromSection).slice(0, 8);
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <RetailHeader ctx={ctx} categories={categories} />
        <main id="main" className="flex-1">{children}</main>
        {/* trust band above the dark footer */}
        <div className="bg-t-dark text-t-dark-fg">
          <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-b border-t-dark-fg/10 py-5 text-xs font-bold uppercase tracking-wide">
            {ctx.settings.commerce.codEnabled ? (
              <span className="inline-flex items-center gap-2">
                <Banknote className="size-4 text-t-accent" /> {t(ui.cashOnDelivery, ctx.lang)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Truck className="size-4 text-t-accent" /> {t(ui.delivery, ctx.lang)}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-t-accent" /> {t(ui.inStock, ctx.lang)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap className="size-4 text-t-accent" /> {t(ui.trackOrder, ctx.lang)}
            </span>
          </Container>
        </div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={{ lang: ctx.lang }} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: promo slider (scroll-snap) + side deal tiles ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const slides = [h.image, ...(h.slides ?? [])].filter((s): s is string => Boolean(s)).slice(0, 4);
  const frames = slides.length ? slides : [""];
  const tiles = (sectionData<CollectionsData>(ctx, collectionsSection)?.items ?? []).slice(0, 2);
  return (
    <section className="bg-t-muted py-4 sm:py-6">
      <Container className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        <div>
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[var(--t-radius)]">
            {frames.map((src, i) => (
              <div key={i} id={`chefline-slide-${i}`} className="relative flex w-full shrink-0 snap-center items-center bg-t-dark text-t-dark-fg">
                <Img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Flame className="size-16 opacity-25" />} />
                <div className="absolute inset-0 bg-gradient-to-r from-t-dark via-t-dark/80 to-t-dark/20 rtl:bg-gradient-to-l" aria-hidden="true" />
                <div className="relative w-full px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
                  {t(h.eyebrow, lang) ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-t-accent-fg">{t(h.eyebrow, lang)}</span> : null}
                  {i === 0 ? (
                    <>
                      <h1 className="font-heading mt-4 max-w-xl text-3xl font-extrabold uppercase leading-[1.05] sm:text-5xl">{t(h.title, lang)}</h1>
                      <p className="mt-4 max-w-lg text-sm text-t-dark-fg/80 sm:text-base">{t(h.subtitle, lang)}</p>
                    </>
                  ) : (
                    <p className="font-heading mt-4 max-w-xl text-2xl font-extrabold uppercase leading-tight sm:text-4xl">{t(h.subtitle, lang)}</p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary font-extrabold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
                    <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-accent font-extrabold uppercase" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {frames.length > 1 ? (
            <div className="mt-3 flex justify-center gap-2">
              {frames.map((_, i) => (
                <a key={i} href={`#chefline-slide-${i}`} className="size-2.5 rounded-full bg-t-border transition hover:bg-t-primary" aria-label={`${t(SLIDE, lang)} ${i + 1}`} />
              ))}
            </div>
          ) : null}
          {h.badges?.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 bg-t-card px-3 py-2.5 text-xs font-bold uppercase">
                  <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {/* side deal tiles */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {tiles.map((c, i) => (
            <Link key={i} href={c.href || "/shop"} className={cn("group relative flex min-h-36 flex-1 items-end overflow-hidden rounded-[var(--t-radius)] p-4", i === 0 ? "bg-t-primary text-t-primary-fg" : "bg-t-accent text-t-accent-fg")}>
              <Img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 transition group-hover:scale-105 group-hover:opacity-40" fallback={<span />} />
              <div className="relative">
                {t(c.subtitle, lang) ? <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{t(c.subtitle, lang)}</span> : null}
                <p className="font-heading text-xl font-extrabold uppercase leading-tight">{t(c.title, lang)}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase underline">
                  {t(ui.shop, lang)} <ChevronRight className="size-3.5 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Promo: yellow coupon ribbon ---------- */
function CouponRibbon({ ctx }: TemplatePageProps) {
  const d = sectionData<PromoData>(ctx, promoSection);
  if (!d) return null;
  const text = t(d.text, ctx.lang);
  if (!text) return null;
  return (
    <section id="promo" className="py-4">
      <Container>
        <div className="flex flex-col items-center justify-between gap-3 bg-t-accent px-5 py-4 text-t-accent-fg sm:flex-row" style={d.bg ? { backgroundColor: d.bg } : undefined}>
          <p className="flex items-center gap-2 text-center font-heading text-base font-extrabold uppercase sm:text-lg">
            <BadgePercent className="size-5" /> {text}
          </p>
          <div className="flex items-center gap-3">
            {d.code ? (
              <span className="border-2 border-dashed border-current px-3 py-1 font-mono text-sm font-extrabold tracking-[0.2em]" aria-label={t(ui.couponCode, ctx.lang)}>
                {d.code}
              </span>
            ) : null}
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-4 py-2 text-sm font-extrabold uppercase" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: dense category grid ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="border-y-4 border-t-muted py-12 sm:py-14">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-6" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className="group flex items-center gap-3 border-2 border-t-muted bg-t-card p-3 transition hover:border-t-primary">
                <Img src={c.image} alt="" className="size-16 shrink-0 object-cover" fallback={<Flame className="size-6 text-t-primary/40" />} />
                <span className="min-w-0">
                  <span className="font-heading block truncate text-sm font-extrabold uppercase group-hover:text-t-primary">{t(c.title, ctx.lang)}</span>
                  {t(c.subtitle, ctx.lang) ? <span className="block truncate text-xs text-t-muted-fg">{t(c.subtitle, ctx.lang)}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: dense grid, red prices, Add always visible ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="bg-t-muted py-12 sm:py-16">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-4 border-t-primary pb-3">
          <h2 className="font-heading flex items-center gap-2 text-2xl font-extrabold uppercase sm:text-3xl">
            <Flame className="size-6 text-t-primary" /> {t(d.title, ctx.lang)}
          </h2>
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-4 py-2 text-sm font-extrabold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid
          products={products}
          ctx={ctx}
          columns={4}
          showQuickAdd
          className="gap-2 sm:gap-3 [&_article]:rounded-none [&_article]:border-2 [&_article]:border-t-border [&_article_button]:inline-flex [&_article_span.font-heading]:text-t-primary"
        />
      </Container>
    </section>
  );
}

/* ---------- Banner: deal block ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-12 sm:py-16">
      <Container>
        <div className={cn("grid overflow-hidden bg-t-dark text-t-dark-fg lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-7 sm:p-10">
            {t(d.eyebrow, ctx.lang) ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-t-accent-fg">{t(d.eyebrow, ctx.lang)}</span> : null}
            <h2 className="font-heading mt-4 text-2xl font-extrabold uppercase leading-tight sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-md text-sm text-t-dark-fg/80 sm:text-base">{t(d.text, ctx.lang)}</p>
            <div className="mt-6">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary font-extrabold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Flame className="size-14 opacity-25" />} />
        </div>
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
        promo: () => <CouponRibbon ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="py-12 sm:py-16 [&_li]:rounded-none [&_li]:border-2 [&_li]:border-t-muted [&_span]:rounded-none" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="border-y-4 border-t-muted py-12 sm:py-16" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" light className="[&_.t-card]:rounded-none" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="py-12 sm:py-16 [&_.t-card]:rounded-none" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted py-12 sm:py-16" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="py-12 sm:py-16" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
