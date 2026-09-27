/**
 * shoes-03 "Stride" (#403) — Sporty, fast, performance footwear.
 * Brief: blue-gradient header with white nav and a glowing cart pill; diagonal clip-path hero (blue panel
 * with the headline, photo panel right) decorated with speed lines; stat tiles with big numbers and gradient
 * borders; product cards carrying a cyan "fast delivery" chip; angled section edges, rounded cards,
 * blue/cyan gradients, fade-up on sections and hover lift.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Gauge, Truck, Zap } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, statsSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData, StatsData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag, QuickAddButton } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import { isInStock, minPrice, salePercent } from "@/modules/ecommerce/pricing";
import type { ProductDTO } from "@/modules/ecommerce/types";

/* ---------- ecommerce pack section shapes ---------- */
type CollectionItem = { title: LocalizedString; subtitle?: LocalizedString; image?: string; href: string };
type CollectionsData = HeadingData & { items?: CollectionItem[] };
type FeaturedData = HeadingData & { mode?: string; count?: number; cta?: LinkData };
type BannerData = HeadingData & { text?: LocalizedString; image?: string; cta?: LinkData; align?: string };

const FAST = ls("Fast delivery", "تیز ڈیلیوری");

async function loadProducts(ctx: SiteContext, d: FeaturedData): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Number(d.count) || 8));
  if (d.mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

const ANGLE = "[clip-path:polygon(0_2.5rem,100%_0,100%_100%,0_calc(100%-2.5rem))]";
const GRADIENT = "bg-gradient-to-br from-t-primary to-t-secondary";
/** speed lines drawn from theme tokens */
const SPEED: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--t-accent) 70%, transparent))",
    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--t-accent) 40%, transparent))",
    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--t-primary-fg) 35%, transparent))",
  ].join(","),
  backgroundSize: "40% 3px, 26% 3px, 32% 3px",
  backgroundPosition: "0 30%, 0 48%, 0 66%",
  backgroundRepeat: "no-repeat",
};

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={null}
          className={cn(GRADIENT, "[&_nav_a]:font-semibold [&_nav_a:hover]:bg-t-primary-fg/15")}
          rightSlot={<CartButton ctx={lc} mode="drawer" className="bg-t-accent px-3 text-t-accent-fg shadow-[0_0_18px_var(--t-accent)] hover:bg-t-accent/90 [&>span]:bg-t-primary-fg [&>span]:text-t-primary" />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-accent" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: diagonal split ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <div className={cn("absolute inset-0 lg:[clip-path:polygon(0_0,72%_0,56%_100%,0_100%)]", GRADIENT)} aria-hidden="true" />
      <Img src={h.image} alt="" className="absolute inset-y-0 end-0 hidden h-full w-1/2 object-cover lg:block" fallback={<span />} />
      <div className="pointer-events-none absolute inset-y-1/4 start-0 w-2/3 opacity-70" style={SPEED} aria-hidden="true" />
      <Container className="relative grid gap-10 py-16 lg:grid-cols-2 lg:py-28">
        <div className="t-fade-up text-t-primary-fg">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-primary-fg/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-t-accent backdrop-blur">
              <Zap className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-t-primary-fg/85 sm:text-lg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn bg-t-accent px-7 font-bold text-t-accent-fg shadow-[0_0_24px_var(--t-accent)] hover:opacity-90" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline border-t-primary-fg/50 px-7 font-bold text-t-primary-fg hover:bg-t-primary-fg/10" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold text-t-primary-fg/85">
                  <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative lg:hidden">
          <Img src={h.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<Gauge className="size-16 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: gradient-edged panels ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className={cn("group relative block rounded-[var(--t-radius)] p-[2px] transition hover:-translate-y-1.5", GRADIENT)}>
                <span className="block overflow-hidden rounded-[calc(var(--t-radius)-1px)] bg-t-card">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-t-muted">
                    <Img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Gauge className="size-10 text-t-primary/30" />} />
                  </span>
                  <span className="block p-5">
                    {t(c.subtitle, ctx.lang) ? <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-t-primary">{t(c.subtitle, ctx.lang)}</span> : null}
                    <span className="font-heading mt-1 flex items-center justify-between gap-2 text-lg font-bold">
                      {t(c.title, ctx.lang)}
                      <ArrowRight className="size-4 text-t-primary transition group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: cards with a "fast delivery" chip ---------- */
function StrideCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const name = t(product.name, ctx.lang);
  const href = `/shop/${product.slug}`;
  const pct = salePercent(product.price, product.comparePrice);
  const hasVariants = product.variants.length > 0;
  const stocked = isInStock(product);
  return (
    <article className="t-card group flex flex-col overflow-hidden transition hover:-translate-y-1.5 hover:shadow-lg">
      <Link href={href} className="relative block overflow-hidden bg-t-muted" aria-label={name}>
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Gauge className="size-12 text-t-primary/30" />} />
        {pct ? <span className="absolute start-2 top-2 rounded-full bg-t-primary px-2 py-0.5 text-[11px] font-bold text-t-primary-fg">-{pct}%</span> : null}
        <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-t-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-t-accent-fg">
          <Truck className="size-3" /> {t(FAST, ctx.lang)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <PriceTag price={minPrice(product)} comparePrice={hasVariants ? null : product.comparePrice} />
          {stocked && !hasVariants ? (
            <QuickAddButton product={product} lang={ctx.lang} className="rounded-full" />
          ) : (
            <Link href={href} className="t-btn t-btn-outline rounded-full px-3 py-2 text-sm text-t-primary">
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          )}
        </div>
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
    <section id="featured" className={cn("bg-t-muted py-20 sm:py-24", ANGLE)}>
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <StrideCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-7 font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
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
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("relative grid items-center overflow-hidden rounded-[var(--t-radius)] text-t-primary-fg lg:grid-cols-2", GRADIENT, d.align === "left" && "lg:[&>*:nth-child(2)]:order-2")}>
          <div className="pointer-events-none absolute inset-y-1/3 start-0 w-1/2 opacity-60" style={SPEED} aria-hidden="true" />
          <div className="relative p-8 sm:p-12">
            {d.eyebrow ? <span className="inline-block rounded-full bg-t-primary-fg/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-t-accent">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-base text-t-primary-fg/85">{t(d.text, ctx.lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn bg-t-accent px-7 font-bold text-t-accent-fg hover:opacity-90" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Gauge className="size-14 opacity-30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Stats: big numbers with gradient borders ---------- */
function StatTiles({ ctx }: TemplatePageProps) {
  const d = sectionData<StatsData>(ctx, statsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="stats" className="py-16 sm:py-20">
      <Container>
        <dl className={cn("grid gap-4", d.items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <div key={i} className={cn("rounded-[var(--t-radius)] p-[2px] transition hover:-translate-y-1", GRADIENT)}>
              <div className="h-full rounded-[calc(var(--t-radius)-1px)] bg-t-bg p-6 text-center">
                <dd className="font-heading bg-gradient-to-br from-t-primary to-t-accent bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">{it.value}</dd>
                <dt className="mt-2 text-sm font-semibold text-t-muted-fg">{t(it.label, ctx.lang)}</dt>
              </div>
            </div>
          ))}
        </dl>
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
        promo: () => <PromoStrip ctx={ctx} className="[&_span]:rounded-full" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="t-fade-up [&_li]:transition [&_li:hover]:-translate-y-1 [&_li:hover]:shadow-lg [&_span]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className={cn("bg-t-muted py-20 sm:py-24", ANGLE)} />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} />,
        stats: () => <StatTiles ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="pb-16" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
