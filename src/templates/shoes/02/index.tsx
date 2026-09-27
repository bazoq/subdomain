/**
 * shoes-02 "Kolhapuri Co." (#402) — Handmade leather, artisan warmth.
 * Brief: cream header with a serif logotype and a leather-brown nav underline; image-left / text-right hero
 * inside a stitched (dashed border) card with craft badges; a "made by hand" about block that carries three
 * process images; testimonials on a leather-brown band; warm paper background, serif headings and stitched
 * dashed dividers between sections.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Hammer, Scissors } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { aboutSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { AboutData, HeadingData, LinkData } from "@/modules/shared/ui/section-types";
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

/** leather-brown band: remap the "dark" surface onto the primary brown */
const BROWN = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
const STITCH = "border-2 border-dashed border-t-primary/40";

/** stitched divider between sections */
function Stitch() {
  return (
    <Container>
      <span className="block border-t-2 border-dashed border-t-border" aria-hidden="true" />
    </Container>
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
          className="border-b-2 border-dashed border-t-border bg-t-bg [&>div>a_span]:font-normal [&_nav_a]:rounded-none [&_nav_a:hover]:bg-transparent [&_nav_a:hover]:border-b-2 [&_nav_a:hover]:border-t-primary [&_nav_a:hover]:text-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="hover:bg-t-muted" />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:font-normal [&_h3]:text-t-accent" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: stitched card, image left ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg py-10 sm:py-16">
      <Container>
        <div className={cn("grid items-center gap-8 p-4 sm:gap-12 sm:p-8 lg:grid-cols-2", STITCH)}>
          <Img src={h.image} alt="" className="aspect-[4/5] w-full rounded-[var(--t-radius)] object-cover" fallback={<Hammer className="size-16 text-t-primary/30" />} />
          <div className="t-fade-up">
            {h.eyebrow ? (
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-t-primary">
                <Scissors className="size-4" /> {h.eyebrow}
              </span>
            ) : null}
            <h1 className="font-heading mt-5 text-3xl font-bold leading-[1.15] text-t-secondary sm:text-4xl lg:text-5xl">{t(h.title, lang)}</h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline px-6 text-t-primary" />
            </div>
            {h.badges?.length ? (
              <ul className="mt-9 flex flex-wrap gap-3">
                {h.badges.map((b, i) => (
                  <li key={i} className={cn("inline-flex items-center gap-2 rounded-[var(--t-radius)] bg-t-muted px-3.5 py-2 text-xs font-bold text-t-secondary", STITCH)}>
                    <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: stitched tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className={cn("group block rounded-[var(--t-radius)] bg-t-card p-3 transition hover:border-t-primary hover:shadow-md", STITCH)}>
                <span className="block overflow-hidden rounded-[var(--t-radius)] bg-t-muted">
                  <Img src={c.image} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Hammer className="size-10 text-t-primary/30" />} />
                </span>
                <span className="mt-4 block px-1 pb-1">
                  <span className="font-heading block text-lg font-bold text-t-secondary group-hover:text-t-primary">{t(c.title, ctx.lang)}</span>
                  {t(c.subtitle, ctx.lang) ? <span className="mt-1 block text-sm text-t-muted-fg">{t(c.subtitle, ctx.lang)}</span> : null}
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
    <section id="featured" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} columns={4} showQuickAdd className="[&_article]:border-2 [&_article]:border-dashed [&_article]:border-t-primary/40" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
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
    <section id="banner" className="py-14 sm:py-20">
      <Container>
        <div className={cn("grid items-center gap-8 rounded-[var(--t-radius)] bg-t-muted p-5 sm:p-10 lg:grid-cols-2", STITCH, d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div>
            {d.eyebrow ? <span className="text-xs font-bold uppercase tracking-[0.2em] text-t-primary">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-4 text-2xl font-bold leading-tight text-t-secondary sm:text-3xl">{title}</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<Hammer className="size-14 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- About: "made by hand" with three process images ---------- */
function Craft({ ctx }: TemplatePageProps) {
  const d = sectionData<AboutData>(ctx, aboutSection);
  if (!d) return null;
  return (
    <section id="about" className="border-y-2 border-dashed border-t-border bg-t-muted py-14 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className={cn("rounded-[var(--t-radius)] bg-t-card p-6 sm:p-9", STITCH)}>
            <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-4" />
            <RichText value={d.body} lang={ctx.lang} className="text-t-muted-fg" />
            {d.highlights?.length ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {d.highlights.map((hl, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-t-secondary">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-4">
                      <Icon name={hl.icon} />
                    </span>
                    {t(hl.text, ctx.lang)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-6" />
            </div>
          </div>
          <div className="space-y-4">
            <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<Hammer className="size-14 text-t-primary/30" />} />
            <GalleryBlock ctx={ctx} variant="strip" take={3} bare className="[&_img]:rounded-[var(--t-radius)]" />
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
        promo: () => <PromoStrip ctx={ctx} className="border-y-2 border-dashed border-t-primary/30" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => (
          <>
            <Stitch />
            <FeaturesBlock ctx={ctx} variant="list" className="py-14 sm:py-20 [&_span]:rounded-full" />
          </>
        ),
        about: () => <Craft ctx={ctx} />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="py-14 sm:py-20 [&_img]:rounded-[var(--t-radius)]" />,
        stats: () => (
          <div className="contents" style={BROWN}>
            <StatsBlock ctx={ctx} variant="row" light className="py-14" />
          </div>
        ),
        testimonials: () => (
          <div className="contents" style={BROWN}>
            <TestimonialsBlock ctx={ctx} variant="grid" columns={3} light className="py-14 sm:py-20 [&_.t-card]:border-t-dark-fg/25 [&_.t-card]:border-dashed" />
          </div>
        ),
        faq: () => (
          <>
            <Stitch />
            <FaqBlock ctx={ctx} variant="two-column" className="py-14 sm:py-20" />
          </>
        ),
        cta: () => <CtaBlock ctx={ctx} variant="card" className="pb-16" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
