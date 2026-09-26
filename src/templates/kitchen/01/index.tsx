/**
 * kitchen-01 "Copper & Clay" (#101) — Warm, editorial kitchenware store.
 * Brief: centered logotype with a thin uppercase nav row below on desktop and a terracotta announcement
 * strip; split hero with an oversized serif headline left and a tall rounded product image right plus a
 * small trust-badge row; collections as three overlapping polaroid cards; featured products in a 4-column
 * soft-cream grid; generous whitespace, serif headings, terracotta buttons, dark-brown footer.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CookingPot, Utensils } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
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

/** thin terracotta rule used as an editorial divider */
function Rule({ className }: { className?: string }) {
  return <span className={cn("block h-px w-16 bg-t-primary", className)} aria-hidden="true" />;
}

/* ---------- Layout: centered logotype + thin nav row ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader ctx={ctx} variant="light" cta={null} className="[&>div>nav]:hidden lg:[&>div>a]:mx-auto" rightSlot={<CartButton ctx={lc} mode="drawer" />} />
        <div className="hidden border-b border-t-border bg-t-bg/95 lg:block">
          <Container className="flex items-center justify-center gap-10 py-3">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-[11px] font-semibold uppercase tracking-[0.25em] text-t-muted-fg transition hover:text-t-primary">
                {t(n.label, ctx.lang)}
              </Link>
            ))}
          </Container>
        </div>
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: oversized serif headline + tall image ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">
              <Rule className="w-10" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-t-fg sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="text-sm font-semibold uppercase tracking-[0.18em] text-t-fg underline decoration-t-primary decoration-2 underline-offset-8 hover:text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-t-border pt-6">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-muted-fg">
                  <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="absolute -bottom-6 -end-6 top-10 w-2/3 rounded-[var(--t-radius)] bg-t-accent/50" aria-hidden="true" />
          <Img src={h.image} alt="" className="relative aspect-[3/4] w-full rounded-[var(--t-radius)] object-cover shadow-xl" fallback={<CookingPot className="size-20 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: overlapping polaroid cards ---------- */
const TILT = ["lg:-rotate-3", "lg:rotate-1", "lg:rotate-3", "lg:-rotate-2"];

function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="flex flex-col items-center gap-8 sm:flex-row sm:flex-wrap sm:justify-center lg:gap-0">
          {d.items.map((c, i) => (
            <li key={i} className={cn("w-full max-w-xs transition duration-300 hover:z-10 hover:-translate-y-2 hover:rotate-0", TILT[i % TILT.length], i > 0 && "lg:-ms-10")}>
              <Link href={c.href || "/shop"} className="block bg-t-card p-3 pb-5 shadow-lg ring-1 ring-t-border">
                <Img src={c.image} alt="" className="aspect-square w-full object-cover" fallback={<Utensils className="size-10 text-t-primary/30" />} />
                <div className="mt-4 text-center">
                  <h3 className="font-heading text-lg font-semibold text-t-fg">{t(c.title, lang)}</h3>
                  {t(c.subtitle, lang) ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-t-muted-fg">{t(c.subtitle, lang)}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: 4-column cream grid ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="border-y border-t-border bg-t-muted py-16 sm:py-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="text-sm font-semibold uppercase tracking-[0.18em] text-t-primary underline decoration-2 underline-offset-8 hover:no-underline" />
        </div>
        <ProductGrid products={products} ctx={ctx} columns={4} showQuickAdd className="[&_article]:border-t-border [&_article]:bg-t-card" />
      </Container>
    </section>
  );
}

/* ---------- Banner: editorial split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn(d.align === "left" && "lg:order-2")}>
          {d.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">
              <Rule className="w-10" /> {d.eyebrow}
            </span>
          ) : null}
          <h2 className="font-heading mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-t-muted-fg">{t(d.text, lang)}</p>
          <div className="mt-8">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<CookingPot className="size-16 text-t-primary/30" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="border-y border-t-border" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:border-0 [&_li]:bg-transparent [&_li]:p-0 [&_span]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16 sm:py-20" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" columns={3} className="[&_.t-card]:border-0 [&_.t-card]:bg-t-muted [&_.t-card]:p-7" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-t border-t-border" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
