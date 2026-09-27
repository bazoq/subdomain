/**
 * kitchen-03 "Nordic Table" (#103) — Scandinavian minimal tableware store.
 * Brief: sticky transparent header that turns white on scroll (logo left, nav centre, icons right);
 * full-bleed hero image with a small left-aligned caption card, light-weight headline and a single CTA;
 * products in a 3-column masonry with hover image swap; collections as a text-only list with arrows;
 * square corners, hairline borders, sage buttons, lots of breathing room, monochrome footer.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Leaf } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import { minPrice, salePercent } from "@/modules/ecommerce/pricing";
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

/* ---------- Layout: transparent → white header ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <div className="relative flex flex-1 flex-col">
          {/* neutral band behind the transparent header on inner pages; the home hero slides under it */}
          <div className="h-16 w-full bg-t-dark lg:h-20" aria-hidden="true" />
          <SiteHeader ctx={ctx} variant="transparent" cta={null} className="[&_nav_a]:text-xs [&_nav_a]:font-medium [&_nav_a]:uppercase [&_nav_a]:tracking-[0.18em]" rightSlot={<CartButton ctx={lc} mode="drawer" />} />
          <main id="main" className="flex-1">{children}</main>
        </div>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:tracking-[0.2em]" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: full-bleed image + caption card ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative -mt-16 flex min-h-[85vh] items-end overflow-hidden bg-t-dark lg:-mt-20">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Leaf className="size-24 opacity-20" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/30" aria-hidden="true" />
      <Container className="relative pb-14 pt-32 sm:pb-20">
        <div className="t-fade-up max-w-md bg-t-bg p-7 sm:p-9">
          {h.eyebrow ? <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-t-primary">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-4 text-3xl font-light leading-[1.15] tracking-tight text-t-fg sm:text-4xl">{t(h.title, lang)}</h1>
          <p className="mt-4 text-sm leading-7 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-7">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-6 text-sm font-medium uppercase tracking-[0.14em]" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
          {h.badges?.length ? <p className="mt-6 border-t border-t-border pt-4 text-[11px] uppercase tracking-[0.18em] text-t-muted-fg">{h.badges.map((b) => b.text).filter(Boolean).join(" · ")}</p> : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: text-only list with arrows ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-10 [&_h2]:font-light" />
        <ul className="border-t border-t-border">
          {d.items.map((c, i) => (
            <li key={i} className="border-b border-t-border">
              <Link href={c.href || "/shop"} className="group flex items-baseline justify-between gap-6 py-6 transition hover:ps-2">
                <span className="min-w-0">
                  <span className="font-heading block text-xl font-light tracking-tight text-t-fg transition group-hover:text-t-primary sm:text-3xl">{t(c.title, ctx.lang)}</span>
                  {t(c.subtitle, ctx.lang) ? <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-t-muted-fg">{t(c.subtitle, ctx.lang)}</span> : null}
                </span>
                <ArrowUpRight className="size-6 shrink-0 text-t-muted-fg transition group-hover:text-t-primary rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Masonry product card with hover image swap ---------- */
const RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]"];

function MasonryCard({ product, ctx, ratio }: { product: ProductDTO; ctx: SiteContext; ratio: string }) {
  const name = t(product.name, ctx.lang);
  const hasVariants = product.variants.length > 0;
  const pct = salePercent(product.price, product.comparePrice);
  return (
    <article className="group break-inside-avoid">
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden bg-t-muted" aria-label={name}>
        <Img src={product.images[0]} alt={name} className={cn("w-full object-cover transition duration-500 group-hover:opacity-0", ratio)} />
        <Img src={product.images[1] || product.images[0]} alt="" className={cn("absolute inset-0 w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100", ratio)} aria-hidden="true" />
        {pct ? <span className="absolute start-0 top-0 bg-t-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-t-primary-fg">-{pct}%</span> : null}
      </Link>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">
          <Link href={`/shop/${product.slug}`} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <PriceTag price={minPrice(product)} comparePrice={hasVariants ? null : product.comparePrice} size="sm" showPercent={false} />
      </div>
    </article>
  );
}

async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="border-y border-t-border py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="mb-12 [&_h2]:font-light" />
        <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
          {products.map((p, i) => (
            <MasonryCard key={p.id} product={p} ctx={ctx} ratio={RATIOS[i % RATIOS.length]} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline px-6 text-sm font-medium uppercase tracking-[0.14em] text-t-fg" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: full-bleed image + caption card ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="relative flex min-h-[26rem] items-center overflow-hidden bg-t-dark">
      <Img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Leaf className="size-20 opacity-20" />} />
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <Container className="relative py-16">
        <div className={cn("max-w-md bg-t-bg p-7 sm:p-9", d.align === "left" && "ms-auto")}>
          {d.eyebrow ? <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-t-primary">{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-3 text-2xl font-light leading-tight tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
          <div className="mt-6">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-6 text-sm font-medium uppercase tracking-[0.14em]" />
          </div>
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
        promo: () => <PromoStrip ctx={ctx} className="bg-t-muted text-t-fg" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className="py-20 sm:py-28 [&_h2]:font-light [&_span]:rounded-none" />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className="border-y border-t-border bg-t-muted py-20 sm:py-28 [&_h2]:font-light" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16 sm:py-20 [&_dd]:font-light" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="py-20 sm:py-28 [&_h2]:font-light" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border py-20 sm:py-28 [&_h2]:font-light" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="py-16 sm:py-20" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
