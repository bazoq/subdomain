/**
 * gifts-03 "Little Things" (#503) — Minimal, cute stationery & keepsakes.
 * Brief: slim lilac header with a rounded logo mark, minimal nav and a heart-icon cart; centered hero with a big
 * rounded headline and a 6-image product mosaic below; "Personalise it" numbered step strip; product cards with a
 * dashed hover border; tidy 4-col grids, pastel lilac bands and hand-drawn (wavy) underlines on headings.
 */
import * as React from "react";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { FeaturesData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

/* hand-drawn underline for headings (applied to h1/h2 via arbitrary variants) */
const WAVY = "underline decoration-wavy decoration-t-accent decoration-[3px] underline-offset-8";
const WAVY_H2 = "[&_h2]:underline [&_h2]:decoration-wavy [&_h2]:decoration-t-accent [&_h2]:decoration-[3px] [&_h2]:underline-offset-8";

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
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="border-b-0 bg-t-muted/95 [&>div]:h-14 lg:[&>div]:h-16 [&>div>a]:rounded-full [&>div>a]:bg-t-primary/10 [&>div>a]:px-4 [&>div>a]:py-1.5 [&>div>a>span]:text-lg [&>div>a>span]:text-t-primary [&_nav_a]:rounded-full [&_nav_a]:text-t-muted-fg [&_nav_a:hover]:bg-t-primary/10 [&_nav_a:hover]:text-t-primary"
          rightSlot={
            <span className="relative inline-flex">
              <CartButton ctx={lc} mode="drawer" className="hover:bg-t-primary/10 [&>svg]:opacity-0" />
              <Heart className="pointer-events-none absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-t-primary" aria-hidden="true" />
            </span>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="light" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: centered headline + 6-tile mosaic ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const tiles: string[] = [];
  for (const src of [h.image, ...(h.slides ?? [])]) if (src && !tiles.includes(src) && tiles.length < 6) tiles.push(src);
  if (tiles.length < 6) {
    const { items } = await getProducts(ctx.tenant.id, { sort: "featured", take: 12 });
    for (const p of items) {
      const src = p.images[0];
      if (src && !tiles.includes(src) && tiles.length < 6) tiles.push(src);
    }
  }
  while (tiles.length < 6) tiles.push("");
  const tilt = ["rotate-1", "-rotate-2", "rotate-2", "-rotate-1", "rotate-1", "-rotate-2"];
  return (
    <section className="bg-t-bg py-14 sm:py-20">
      <Container className="text-center">
        {h.eyebrow ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-t-accent/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-fg">
            <Sparkles className="size-4 text-t-primary" /> {h.eyebrow}
          </span>
        ) : null}
        <h1 className={cn("font-heading mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] text-t-fg sm:text-5xl lg:text-6xl", WAVY)}>{t(h.title, lang)}</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary" />
        </div>
        <ul className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {tiles.map((src, i) => (
            <li key={i} className={cn("transition hover:rotate-0 hover:scale-105", tilt[i])}>
              <Img src={src} alt="" priority={i === 0} className="aspect-square w-full rounded-[var(--t-radius)] border-2 border-dashed border-t-border object-cover" fallback={<Heart className="size-8 text-t-primary/40" />} />
            </li>
          ))}
        </ul>
        {h.badges?.length ? (
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {h.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm font-medium text-t-muted-fg">
                <span className="text-t-primary [&_svg]:size-4">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Collections: tidy grid ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} className={WAVY_H2} />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group block rounded-[var(--t-radius)] border-2 border-dashed border-t-border bg-t-card p-3 transition hover:border-t-primary">
                  <Img src={it.image} alt="" className="aspect-square w-full rounded-[var(--t-radius)] object-cover" fallback={<Sparkles className="size-10 text-t-primary/40" />} />
                  <h3 className="font-heading mt-3 text-lg font-semibold text-t-fg group-hover:text-t-primary">{t(it.title, lang)}</h3>
                  {sub ? <p className="text-sm text-t-muted-fg">{sub}</p> : null}
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products: dashed hover border ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d.mode, d.count);
  if (!products.length) return null;
  return (
    <section id="products" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className={WAVY_H2} />
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:border-2 [&_article]:transition [&_article:hover]:border-dashed [&_article:hover]:border-t-primary [&_article:hover]:shadow-none" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- "Personalise it" step strip (features section) ---------- */
function StepStrip({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturesData>(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  const cols = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[Math.min(4, d.items.length) as 1 | 2 | 3 | 4];
  return (
    <section id="features" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} className={WAVY_H2} />
        <ol className={cn("relative grid gap-10 sm:grid-cols-2", cols)}>
          {d.items.length > 1 ? <div className="absolute inset-x-[12%] top-7 hidden border-t-2 border-dashed border-t-primary/40 lg:block" aria-hidden="true" /> : null}
          {d.items.map((it, i) => (
            <li key={i} className="relative text-center">
              <span className="font-heading relative mx-auto flex size-14 items-center justify-center rounded-full bg-t-primary text-xl font-bold text-t-primary-fg ring-8 ring-t-muted">{i + 1}</span>
              <span className="mx-auto mt-4 flex size-12 items-center justify-center rounded-[var(--t-radius)] bg-t-card text-t-primary shadow-sm [&_svg]:size-6">
                <Icon name={it.icon} />
              </span>
              <h3 className="font-heading mt-3 text-lg font-bold">{t(it.title, lang)}</h3>
              <p className="mt-1 text-sm text-t-muted-fg">{t(it.text, lang)}</p>
            </li>
          ))}
        </ol>
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
        <div className={cn("grid items-center gap-8 rounded-[var(--t-radius)] border-2 border-dashed border-t-primary/40 bg-t-card p-4 lg:grid-cols-2 lg:p-6", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-4 sm:p-8">
            {d.eyebrow ? <span className="t-eyebrow">{d.eyebrow}</span> : null}
            <h2 className={cn("font-heading mt-2 text-3xl font-bold sm:text-4xl", WAVY)}>{title}</h2>
            <p className="mt-5 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full" />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<Heart className="size-16 text-t-primary/30" />} />
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <StepStrip ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className={WAVY_H2} />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className={cn("bg-t-muted", WAVY_H2)} />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" columns={3} className={cn("bg-t-muted", WAVY_H2)} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className={WAVY_H2} />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
