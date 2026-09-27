/**
 * clothing-04 "Khaadi Lane" (#304) — Modern heritage, block-print inspired.
 * Brief: indigo header band with a mustard underline on the active nav item, logo left and a GET /shop?q=
 * search beside it; asymmetric bento hero (headline card on cream, two stacked product images, a small
 * block-print pattern tile); every section eyebrow sits inside a small mustard chip; collections as a
 * four-tile bento grid; geometric CSS pattern backgrounds and an indigo footer.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search, Shirt } from "lucide-react";
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
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, sui } from "@/modules/ecommerce/ui";
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

/** indigo chrome: remap the "dark" surface onto the indigo primary for header/footer/stat bands */
const INDIGO = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
/** every section eyebrow becomes a small mustard chip */
const CHIP = "[&_.t-eyebrow]:inline-block [&_.t-eyebrow]:bg-t-accent [&_.t-eyebrow]:px-2.5 [&_.t-eyebrow]:py-1 [&_.t-eyebrow]:text-t-accent-fg";
/** block-print inspired geometry, tokens only */
const PATTERN: React.CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--t-primary) 14%, transparent) 0 6px, transparent 6px 14px)",
    "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--t-accent) 18%, transparent) 0 6px, transparent 6px 14px)",
  ].join(","),
};

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <div className="contents" style={INDIGO}>
          <SiteHeader
            ctx={ctx}
            variant="dark"
            cta={null}
            className="[&_nav_a]:rounded-none [&_nav_a]:text-sm [&_nav_a]:uppercase [&_nav_a]:tracking-[0.12em] [&_nav_a:hover]:bg-transparent [&_nav_a[aria-current=page]]:border-b-2 [&_nav_a[aria-current=page]]:border-t-accent [&_nav_a[aria-current=page]]:text-t-dark-fg"
            rightSlot={
              <>
                <form action="/shop" method="get" role="search" className="relative hidden items-center md:flex">
                  <label htmlFor="khaadi-q" className="sr-only">
                    {t(ui.search, ctx.lang)}
                  </label>
                  <input id="khaadi-q" name="q" type="search" placeholder={t(sui.searchPlaceholder, ctx.lang)} className="h-10 w-48 border border-t-dark-fg/30 bg-t-dark-fg/10 ps-9 text-sm text-t-dark-fg placeholder:text-t-dark-fg/60 focus:outline-none focus:ring-2 focus:ring-t-accent lg:w-64" />
                  <Search className="pointer-events-none absolute start-3 size-4 text-t-dark-fg/70" aria-hidden="true" />
                </form>
                <CartButton ctx={lc} mode="drawer" className="rounded-none hover:bg-t-dark-fg/10 [&>span]:rounded-none [&>span]:bg-t-accent [&>span]:text-t-accent-fg" />
              </>
            }
          />
        </div>
        <main id="main" className="flex-1">{children}</main>
        <div className="contents" style={INDIGO}>
          <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-accent" />
        </div>
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: asymmetric bento ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const pics = [h.image, ...(h.slides ?? [])].filter((s): s is string => Boolean(s));
  return (
    <section className="bg-t-bg py-6 sm:py-10">
      <Container>
        <div className="grid gap-3 lg:grid-cols-3 lg:grid-rows-2">
          <div className="t-fade-up flex flex-col justify-center bg-t-muted p-8 sm:p-12 lg:col-span-2 lg:row-span-2">
            {t(h.eyebrow, lang) ? <span className="inline-block self-start bg-t-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-t-accent-fg">{t(h.eyebrow, lang)}</span> : null}
            <h1 className="font-heading mt-6 text-4xl leading-[1.08] tracking-tight text-t-primary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-t-muted-fg sm:text-lg">{t(h.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline px-7 text-t-primary" />
            </div>
            {h.badges?.length ? (
              <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-2 border-t border-t-border pt-5">
                {h.badges.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-t-muted-fg">
                    <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Img src={pics[0]} alt="" priority className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full" fallback={<Shirt className="size-12 text-t-primary/30" />} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
            <Img src={pics[1]} alt="" className="aspect-square w-full object-cover" fallback={<Shirt className="size-10 text-t-primary/30" />} />
            <div className="relative aspect-square w-full bg-t-muted lg:aspect-auto" aria-hidden="true">
              <div className="absolute inset-0" style={PATTERN} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: 4-tile bento ---------- */
const SPANS = ["sm:col-span-2 sm:row-span-2", "", "", "sm:col-span-2"];

function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <div className="mb-8">
          {t(d.eyebrow, ctx.lang) ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-t-accent-fg">{t(d.eyebrow, ctx.lang)}</span> : null}
          <h2 className="font-heading mt-3 text-3xl tracking-tight text-t-primary sm:text-4xl">{t(d.title, ctx.lang)}</h2>
        </div>
        <ul className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:grid-cols-4">
          {d.items.map((c, i) => (
            <li key={i} className={cn(SPANS[i % SPANS.length])}>
              <Link href={c.href || "/shop"} className="group relative flex h-full items-end overflow-hidden bg-t-primary p-4">
                <Img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" fallback={<span />} />
                <span className="absolute inset-0 bg-gradient-to-t from-t-secondary/85 via-t-secondary/20 to-transparent" aria-hidden="true" />
                <span className="relative text-t-secondary-fg">
                  {t(c.subtitle, ctx.lang) ? <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-t-accent">{t(c.subtitle, ctx.lang)}</span> : null}
                  <span className="font-heading mt-1 block text-lg leading-tight sm:text-2xl">{t(c.title, ctx.lang)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="relative border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container className="relative">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {t(d.eyebrow, ctx.lang) ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-t-accent-fg">{t(d.eyebrow, ctx.lang)}</span> : null}
            <h2 className="font-heading mt-3 text-3xl tracking-tight text-t-primary sm:text-4xl">{t(d.title, ctx.lang)}</h2>
          </div>
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline px-5 py-2 text-sm text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid products={products} ctx={ctx} columns={4} showQuickAdd className="[&_article]:rounded-none [&_article]:bg-t-card" />
      </Container>
    </section>
  );
}

/* ---------- Banner: split with pattern edge ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-stretch lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="relative bg-t-primary p-8 text-t-primary-fg sm:p-12">
            <div className="absolute inset-y-0 end-0 w-6 opacity-40" style={PATTERN} aria-hidden="true" />
            {t(d.eyebrow, ctx.lang) ? <span className="inline-block bg-t-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-t-accent-fg">{t(d.eyebrow, ctx.lang)}</span> : null}
            <h2 className="font-heading mt-5 text-3xl leading-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-base text-t-primary-fg/80">{t(d.text, ctx.lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn bg-t-accent px-7 text-t-accent-fg hover:opacity-90" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Shirt className="size-14 text-t-primary/30" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="[&_span]:rounded-none" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className={cn(CHIP, "[&_li]:rounded-none [&_span]:rounded-none [&_h2]:text-t-primary")} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className={cn(CHIP, "bg-t-muted [&_h2]:text-t-primary [&_img]:rounded-none")} />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className={cn(CHIP, "[&_h2]:text-t-primary")} />,
        stats: () => (
          <div className="contents" style={INDIGO}>
            <StatsBlock ctx={ctx} variant="row" light className="py-16" />
          </div>
        ),
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className={cn(CHIP, "bg-t-muted [&_.t-card]:rounded-none [&_h2]:text-t-primary")} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className={cn(CHIP, "[&_h2]:text-t-primary")} />,
        cta: () => (
          <div className="contents" style={INDIGO}>
            <CtaBlock ctx={ctx} variant="banner" />
          </div>
        ),
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
