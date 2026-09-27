/**
 * shoes-01 "Sole Studio" (#401) — Sneaker culture, bold and clean.
 * Brief: white header with a thick black bottom border, condensed uppercase nav and an orange cart button;
 * product-centric hero with a huge shoe image floating over an orange circle and the headline stacked left;
 * size chips revealed on card hover; "new drops" horizontal scroll row; high contrast with black section
 * header bars, orange CTAs and a sneaker grid.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Footprints } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import { isInStock, minPrice, salePercent } from "@/modules/ecommerce/pricing";
import type { ProductDTO } from "@/modules/ecommerce/types";

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

/** black section header bar with an orange eyebrow */
function BlackHeading({ eyebrow, title, lang, action }: { eyebrow?: string; title?: LocalizedString; lang: "en" | "ur"; action?: React.ReactNode }) {
  const ttl = t(title, lang);
  if (!ttl && !eyebrow) return null;
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-t-secondary px-5 py-4 sm:px-7">
      <div>
        {eyebrow ? <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-t-primary">{eyebrow}</span> : null}
        {ttl ? <h2 className="font-heading text-2xl font-medium uppercase tracking-wide text-t-secondary-fg sm:text-3xl">{ttl}</h2> : null}
      </div>
      {action}
    </div>
  );
}

/** sizes available for a product, read from its variant options (prefers a "size" option) */
function sizesOf(product: ProductDTO): string[] {
  const out: string[] = [];
  for (const v of product.variants) {
    const sizeKey = Object.keys(v.options).find((k) => /size|سائز/i.test(k));
    const value = (sizeKey ? v.options[sizeKey] : Object.values(v.options)[0]) ?? v.name;
    if (value && !out.includes(value)) out.push(value);
  }
  return out.slice(0, 7);
}

function SneakerCard({ product, ctx, className }: { product: ProductDTO; ctx: SiteContext; className?: string }) {
  const name = t(product.name, ctx.lang);
  const href = `/shop/${product.slug}`;
  const sizes = sizesOf(product);
  const pct = salePercent(product.price, product.comparePrice);
  const hasVariants = product.variants.length > 0;
  return (
    <article className={cn("group relative overflow-hidden border-2 border-t-secondary bg-t-card", className)}>
      <Link href={href} className="relative block overflow-hidden bg-t-muted" aria-label={name}>
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Footprints className="size-12 text-t-primary/40" />} />
        {pct ? <span className="absolute start-0 top-0 bg-t-primary px-2 py-1 text-[11px] font-bold uppercase text-t-primary-fg">-{pct}%</span> : null}
        {!isInStock(product) ? (
          <span className="absolute inset-x-0 bottom-0 bg-t-secondary/90 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-t-secondary-fg">{t(ui.outOfStock, ctx.lang)}</span>
        ) : sizes.length ? (
          <span className="absolute inset-x-0 bottom-0 flex translate-y-full flex-wrap gap-1 bg-t-secondary/95 p-2 transition duration-300 group-hover:translate-y-0">
            {sizes.map((s) => (
              <span key={s} className="min-w-8 border border-t-secondary-fg/40 px-1.5 py-0.5 text-center text-[11px] font-bold text-t-secondary-fg">
                {s}
              </span>
            ))}
          </span>
        ) : null}
      </Link>
      <div className="p-3 sm:p-4">
        <h3 className="font-heading line-clamp-1 text-sm font-medium uppercase tracking-wide">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <PriceTag price={minPrice(product)} comparePrice={hasVariants ? null : product.comparePrice} className="mt-1.5" />
      </div>
    </article>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="border-b-4 border-t-secondary [&_nav_a]:text-xs [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-[0.18em]"
          rightSlot={<CartButton ctx={lc} mode="drawer" showLabel className="rounded-[var(--t-radius)] bg-t-primary px-3 text-t-primary-fg hover:bg-t-primary/90 [&>span]:bg-t-secondary [&>span]:text-t-secondary-fg" />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-primary" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: shoe over an orange circle ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-block bg-t-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-t-primary">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 break-words text-5xl font-medium uppercase leading-[0.92] tracking-tight text-t-secondary sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-t-muted-fg sm:text-lg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 font-semibold uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn bg-t-secondary px-7 font-semibold uppercase tracking-wide text-t-secondary-fg hover:opacity-90" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-t-muted-fg">
                  <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
          <span className="absolute inset-4 rounded-full bg-t-primary" aria-hidden="true" />
          <span className="absolute inset-0 rounded-full border-2 border-t-secondary/15" aria-hidden="true" />
          <Img src={h.image} alt="" priority className="relative w-[88%] -rotate-12 object-contain drop-shadow-2xl" fallback={<Footprints className="size-24 text-t-secondary/40" />} />
        </div>
      </Container>
      <div className="h-3 w-full bg-t-secondary" aria-hidden="true" />
    </section>
  );
}

/* ---------- Collections: photo tiles with black label bars ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-14 sm:py-20">
      <Container>
        <BlackHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className="group block border-2 border-t-secondary">
                <span className="relative block aspect-[4/3] overflow-hidden bg-t-muted">
                  <Img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Footprints className="size-10 text-t-primary/40" />} />
                </span>
                <span className="flex items-center justify-between gap-3 bg-t-secondary px-4 py-3">
                  <span>
                    <span className="font-heading block text-lg font-medium uppercase tracking-wide text-t-secondary-fg">{t(c.title, ctx.lang)}</span>
                    {t(c.subtitle, ctx.lang) ? <span className="block text-[11px] uppercase tracking-widest text-t-primary">{t(c.subtitle, ctx.lang)}</span> : null}
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-t-primary transition group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: "new drops" scroll row ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  const more = <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-5 py-2 text-sm font-semibold uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />;
  return (
    <section id="featured" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <BlackHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} action={<div className="hidden sm:block">{more}</div>} />
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {products.map((p) => (
            <SneakerCard key={p.id} product={p} ctx={ctx} className="w-56 shrink-0 snap-start sm:w-64" />
          ))}
        </div>
        <div className="mt-6 sm:hidden">{more}</div>
      </Container>
    </section>
  );
}

/* ---------- Banner ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-14 sm:py-20">
      <Container>
        <div className={cn("grid items-stretch border-2 border-t-secondary lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="bg-t-secondary p-8 text-t-secondary-fg sm:p-12">
            {d.eyebrow ? <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-t-primary">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-4 text-3xl font-medium uppercase leading-tight tracking-wide sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-t-secondary-fg/75 sm:text-base">{t(d.text, ctx.lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-7 font-semibold uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Footprints className="size-14 text-t-primary/40" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="bg-t-secondary text-t-secondary-fg [&_p]:uppercase [&_p]:tracking-wide" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_h2]:uppercase [&_h2]:tracking-wide [&_h3]:uppercase [&_li]:border-2 [&_li]:border-t-secondary" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-wide" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" columns={4} className="[&_h2]:uppercase [&_h2]:tracking-wide" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-wide" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_h2]:uppercase [&_h2]:tracking-wide" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase [&_h2]:tracking-wide" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
