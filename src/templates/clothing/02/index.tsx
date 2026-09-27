/**
 * clothing-02 "StreetForm" (#302) — Dark streetwear store for the youth.
 * Brief: black sticky header with an oversized condensed logo, lime hover nav and a pink cart count; giant
 * condensed headline over a grainy photo with a scrolling marquee built from the hero trust badges; promo
 * strip as a diagonal lime ticker; product cards with lime prices and a QUICK ADD that appears on hover;
 * dark mode throughout, hard edges, lime/pink accents and visible grid lines.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Shirt } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, promoSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData, PromoData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
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

/** film-grain / halftone overlay built only from theme tokens */
const GRAIN: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(color-mix(in srgb, var(--t-fg) 22%, transparent) 1px, transparent 1px)",
    "radial-gradient(color-mix(in srgb, var(--t-fg) 12%, transparent) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "4px 4px, 7px 7px",
  backgroundPosition: "0 0, 2px 3px",
};
/** faint grid lines used behind section content */
const GRID: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, color-mix(in srgb, var(--t-border) 90%, transparent) 1px, transparent 1px)",
    "linear-gradient(to bottom, color-mix(in srgb, var(--t-border) 90%, transparent) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "72px 72px, 72px 72px",
};

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={null}
          className="border-b border-t-border [&>div>a_span]:text-3xl [&>div>a_span]:uppercase [&>div>a_span]:tracking-tight lg:[&>div>a_span]:text-4xl [&_nav_a]:rounded-none [&_nav_a]:text-xs [&_nav_a]:font-normal [&_nav_a]:uppercase [&_nav_a]:tracking-[0.2em] [&_nav_a:hover]:bg-transparent [&_nav_a:hover]:text-t-primary"
          rightSlot={
            <>
              <Link href="/shop" className="hidden border border-t-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-t-primary transition hover:bg-t-primary hover:text-t-primary-fg md:inline-flex">
                {t(ui.shop, ctx.lang)}
              </Link>
              <CartButton ctx={lc} mode="drawer" className="rounded-none hover:bg-t-dark-fg/10 [&>span]:rounded-none [&>span]:bg-t-accent [&>span]:text-t-accent-fg" />
            </>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border [&_h3]:text-t-primary" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: giant headline over grain + badge marquee ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const ticker = (h.badges ?? []).map((b) => b.text).filter(Boolean);
  const loop = ticker.length ? [...ticker, ...ticker, ...ticker, ...ticker] : [];
  return (
    <>
      <section className="relative overflow-hidden bg-t-muted">
        <Img src={h.image} alt="" priority className="absolute inset-0 h-full w-full object-cover opacity-60" fallback={<Shirt className="size-24 opacity-20" />} />
        <div className="pointer-events-none absolute inset-0 opacity-60" style={GRAIN} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/40 to-transparent" aria-hidden="true" />
        <Container className="relative py-20 sm:py-28 lg:py-36">
          <div className="t-fade-up">
            {h.eyebrow ? <span className="inline-block bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">{h.eyebrow}</span> : null}
            <h1 className="font-heading mt-6 max-w-4xl break-words text-5xl font-normal uppercase leading-[0.88] tracking-tight sm:text-7xl lg:text-[8rem]">{t(h.title, lang)}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-t-muted-fg">{t(h.subtitle, lang)}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 text-sm font-bold uppercase tracking-[0.18em]" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border border-t-accent px-7 text-sm font-bold uppercase tracking-[0.18em] text-t-accent hover:bg-t-accent hover:text-t-accent-fg" />
            </div>
          </div>
        </Container>
      </section>
      {loop.length ? (
        <div className="overflow-hidden border-y border-t-border bg-t-primary py-2.5 text-t-primary-fg">
          <ul className="t-marquee flex w-max items-center gap-8" aria-hidden="true">
            {loop.map((text, i) => (
              <li key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-bold uppercase tracking-[0.22em]">
                {text} <span>—</span>
              </li>
            ))}
          </ul>
          <ul className="sr-only">
            {ticker.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/* ---------- Promo: diagonal lime ticker ---------- */
function DiagonalTicker({ ctx }: TemplatePageProps) {
  const d = sectionData<PromoData>(ctx, promoSection);
  if (!d) return null;
  const text = t(d.text, ctx.lang);
  if (!text) return null;
  const line = d.code ? `${text} · ${d.code}` : text;
  const loop = [line, line, line, line, line, line];
  return (
    <section id="promo" className="relative overflow-hidden py-10">
      <div className="-mx-4 -rotate-2 overflow-hidden bg-t-accent py-2.5 text-t-accent-fg" style={d.bg ? { backgroundColor: d.bg } : undefined}>
        <ul className="t-marquee flex w-max items-center gap-8" aria-hidden="true">
          {loop.map((l, i) => (
            <li key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-bold uppercase tracking-[0.22em]">
              {l} <Flame className="size-4" />
            </li>
          ))}
        </ul>
        <p className="sr-only">{line}</p>
      </div>
    </section>
  );
}

/* ---------- Collections: bordered dark cards ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="relative py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={GRID} aria-hidden="true" />
      <Container className="relative">
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-10 [&_h2]:uppercase [&_h2]:tracking-tight" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className="group relative block aspect-[4/5] overflow-hidden border border-t-border bg-t-card transition hover:border-t-primary">
                <Img src={c.image} alt="" className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" fallback={<Shirt className="size-12 opacity-25" />} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 p-5">
                  {t(c.subtitle, ctx.lang) ? <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-t-accent">{t(c.subtitle, ctx.lang)}</span> : null}
                  <span className="font-heading mt-1 block text-3xl font-normal uppercase leading-none text-white transition group-hover:text-t-primary">{t(c.title, ctx.lang)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: lime prices, hover QUICK ADD ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="border-y border-t-border bg-t-muted py-16 sm:py-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0 [&_h2]:uppercase [&_h2]:tracking-tight" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn border border-t-primary px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-t-primary hover:bg-t-primary hover:text-t-primary-fg" />
        </div>
        <ProductGrid
          products={products}
          ctx={ctx}
          columns={4}
          showQuickAdd
          className="[&_article]:rounded-none [&_article]:border-t-border [&_article_button]:rounded-none [&_article_button]:uppercase [&_article_button]:tracking-[0.15em] [@media(hover:hover)]:[&_article_button]:opacity-0 [&_article_button]:transition [&_article:hover_button]:opacity-100 [&_article_button:focus-visible]:opacity-100 [&_article_span.font-heading]:text-t-primary"
        />
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
    <section id="banner" className="py-16 sm:py-24">
      <Container className="grid items-stretch gap-0 border border-t-border lg:grid-cols-2">
        <div className={cn("bg-t-card p-8 sm:p-12", d.align === "left" && "lg:order-2")}>
          {d.eyebrow ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-t-accent-fg">{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-5 text-4xl font-normal uppercase leading-[0.95] tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
          <div className="mt-8">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-7 text-sm font-bold uppercase tracking-[0.18em]" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Shirt className="size-16 opacity-25" />} />
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
        promo: () => <DiagonalTicker ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => (
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 opacity-70" style={GRID} aria-hidden="true" />
            <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="relative [&_h2]:uppercase [&_h2]:tracking-tight [&_li]:rounded-none [&_li]:border-t-border [&_span]:rounded-none [&_span]:bg-t-primary/15 [&_span]:text-t-primary" />
          </div>
        ),
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted [&_h2]:uppercase [&_img]:rounded-none" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" columns={4} className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="border-y border-t-border py-16" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted [&_h2]:uppercase [&_h2]:tracking-tight" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
