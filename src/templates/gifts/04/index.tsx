/**
 * gifts-04 "Bloom & Box" (#504) — Florist-first with dark botanical mood.
 * Brief: transparent header over the hero with thin gold nav, solid dark on scroll; full-bleed floral hero with dark
 * gradient, serif headline, gold CTA and a same-day note row; featured products as large image-first cards with a
 * hover overlay price; promo as a gold ribbon; dark botanical theme, gold accents, serif headings, generous imagery.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flower2, Leaf } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, promoSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { PromoData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag, QuickAddButton, isInStock, minPrice, sui, type ProductDTO } from "@/modules/ecommerce/ui";
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
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <div className="relative flex flex-1 flex-col">
          <SiteHeader
            ctx={ctx}
            variant="transparent"
            cta={null}
            className="[&_nav_a]:font-normal [&_nav_a]:tracking-wide [&_nav_a]:text-t-primary [&_nav_a:hover]:bg-t-primary/10"
            rightSlot={<CartButton ctx={lc} mode="drawer" className="text-t-primary hover:bg-t-primary/10" />}
          />
          {/* pages get room for the absolute header; the hero pulls itself back under it */}
          <main id="main" className="flex-1 pt-16 lg:pt-20">{children}</main>
        </div>
        <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: full-bleed floral ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative -mt-16 min-h-[88vh] overflow-hidden bg-t-dark lg:-mt-20">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Flower2 className="size-24 text-t-primary/30" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/70 to-t-bg/10" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-t-dark/70 to-transparent" aria-hidden="true" />
      <Container className="relative flex min-h-[88vh] flex-col justify-end pb-20 pt-36 lg:pb-28">
        <div className="max-w-2xl t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">
              <Leaf className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-5xl font-medium leading-[1.05] text-t-fg sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-t-border pt-6">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-t-muted-fg">
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

/* ---------- Promo as gold ribbon ---------- */
function GoldRibbon({ ctx }: TemplatePageProps) {
  const d = sectionData<PromoData>(ctx, promoSection);
  if (!d) return null;
  const text = t(d.text, ctx.lang);
  if (!text) return null;
  return (
    <section id="promo" className="py-8">
      <Container>
        <div
          className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 bg-t-primary px-12 py-3 text-center text-t-primary-fg sm:flex-row sm:gap-5 [clip-path:polygon(0_0,100%_0,calc(100%-16px)_50%,100%_100%,0_100%,16px_50%)]"
          style={d.bg ? { backgroundColor: d.bg } : undefined}
        >
          <p className="font-heading text-lg font-semibold">{text}</p>
          {d.code ? <span className="border border-current/40 px-3 py-0.5 font-mono text-sm font-bold tracking-wider">{d.code}</span> : null}
          <CtaButton value={d.cta} ctx={ctx} className="text-sm font-bold underline underline-offset-4 hover:no-underline" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: photographic tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="[&_h2]:font-medium" />
        <ul className={cn("grid gap-5 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group relative block overflow-hidden rounded-[var(--t-radius)] bg-t-card">
                  <Img src={it.image} alt="" className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Flower2 className="size-12 text-t-primary/40" />} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-t-dark/90 to-transparent p-5 pt-16">
                    <h3 className="font-heading text-2xl text-t-fg">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-t-primary">
                      {t(ui.shop, lang)} <ArrowRight className="size-3 rtl:rotate-180" />
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

/* ---------- Image-first product card with hover overlay price ---------- */
function BloomCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  return (
    <article className="group relative overflow-hidden rounded-[var(--t-radius)] bg-t-card">
      <Link href={href} aria-label={name} className="block">
        <Img src={product.images[0]} alt={name} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Flower2 className="size-14 text-t-primary/40" />} />
      </Link>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-t-dark/95 via-t-dark/60 to-transparent p-5 pt-20">
        {product.category ? <span className="text-[11px] uppercase tracking-[0.2em] text-t-primary">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading text-xl text-t-fg">
          <Link href={href} className="pointer-events-auto hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <div className="mt-3 flex items-center justify-between gap-3 transition duration-300 sm:[@media(hover:hover)]:translate-y-2 sm:[@media(hover:hover)]:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
          {inStock && !hasVariants ? (
            <QuickAddButton product={product} lang={lang} className="pointer-events-auto px-3 py-1.5 text-xs" />
          ) : inStock ? (
            <Link href={href} className="t-btn t-btn-outline pointer-events-auto px-3 py-1.5 text-xs text-t-fg">
              {t(ui.viewDetails, lang)}
            </Link>
          ) : (
            <span className="rounded-full bg-t-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-t-muted-fg">{t(ui.outOfStock, lang)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

async function Products({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d.mode, d.count);
  if (!products.length) return null;
  return (
    <section id="products" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0 [&_h2]:font-medium" />
          <CtaButton value={d.cta} ctx={ctx} className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.2em] text-t-primary hover:underline" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <BloomCard key={p.id} product={p} ctx={ctx} />
          ))}
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
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-stretch overflow-hidden rounded-[var(--t-radius)] border border-t-primary/40 bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            {d.eyebrow ? <span className="text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto lg:min-h-[22rem]" fallback={<Leaf className="size-16 text-t-primary/30" />} />
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
        promo: () => <GoldRibbon ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_h2]:font-medium" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted [&_h2]:font-medium" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="[&_h2]:font-medium" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="[&_h2]:font-medium" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted [&_h2]:font-medium" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:font-medium" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
