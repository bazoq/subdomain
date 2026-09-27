/**
 * shoes-04 "Maison Heel" (#404) — Elegant women's heels and bridal footwear.
 * Brief: centred serif logotype with a gold hairline under the header and an uppercase micro-nav row below;
 * three-panel hero (image | text | image) on a champagne ground with a single black CTA; collections as
 * gold-framed portraits; lookbook in an oversized two-column grid; square corners, gold hairlines and a
 * black footer with champagne headings.
 */
import * as React from "react";
import Link from "next/link";
import { Gem, Sparkle } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
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

const MICRO = "text-[10px] font-medium uppercase tracking-[0.3em]";

/* ---------- Layout: centred logotype + micro-nav ---------- */
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
          className="border-b border-t-accent [&>div>nav]:hidden lg:[&>div>a]:mx-auto [&>div>a_span]:font-normal [&>div>a_span]:tracking-[0.3em]"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-none hover:bg-t-muted" />}
        />
        <div className="hidden border-b border-t-border bg-t-bg lg:block">
          <Container className="flex items-center justify-center gap-10 py-3">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn(MICRO, "text-t-muted-fg transition hover:text-t-accent")}>
                {t(n.label, ctx.lang)}
              </Link>
            ))}
          </Container>
        </div>
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:font-normal [&_h3]:tracking-[0.25em] [&_h3]:text-t-accent" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: three panels ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const pics = [h.image, ...(h.slides ?? [])].filter((s): s is string => Boolean(s));
  return (
    <section className="bg-t-muted">
      <Container className="grid items-stretch gap-6 py-10 lg:grid-cols-3 lg:gap-8 lg:py-16">
        <Img src={pics[0]} alt="" priority className="order-2 aspect-[3/4] w-full object-cover lg:order-1" fallback={<Gem className="size-12 text-t-accent" />} />
        <div className="t-fade-up order-1 flex flex-col items-center justify-center border border-t-accent/60 bg-t-bg p-8 text-center sm:p-10 lg:order-2">
          {h.eyebrow ? (
            <span className={cn(MICRO, "flex items-center gap-2 text-t-accent")}>
              <Sparkle className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-3xl font-normal leading-[1.1] tracking-tight text-t-fg sm:text-4xl lg:text-5xl">{t(h.title, lang)}</h1>
          <span className="my-6 block h-px w-16 bg-t-accent" aria-hidden="true" />
          <p className="max-w-sm text-sm leading-7 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8">
            <CtaButton value={h.primaryCta} ctx={ctx} className={cn("t-btn bg-t-secondary px-8 text-t-secondary-fg hover:opacity-90", MICRO)} />
          </div>
          {h.badges?.length ? <p className={cn(MICRO, "mt-8 text-t-muted-fg")}>{h.badges.map((b) => b.text).filter(Boolean).join(" · ")}</p> : null}
        </div>
        <Img src={pics[1] || pics[0]} alt="" className="order-3 aspect-[3/4] w-full object-cover" fallback={<Gem className="size-12 text-t-accent" />} />
      </Container>
    </section>
  );
}

/* ---------- Collections: gold-framed portraits ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="mb-12 [&_h2]:font-normal [&_span]:tracking-[0.3em]" />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className="group block border border-t-accent p-3 transition hover:bg-t-muted">
                <span className="block border border-t-accent/50 p-1.5">
                  <span className="block overflow-hidden bg-t-muted">
                    <Img src={c.image} alt="" className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" fallback={<Gem className="size-10 text-t-accent" />} />
                  </span>
                </span>
                <span className="block px-2 py-4 text-center">
                  <span className="font-heading block text-xl font-normal tracking-tight text-t-fg group-hover:text-t-accent">{t(c.title, ctx.lang)}</span>
                  {t(c.subtitle, ctx.lang) ? <span className={cn(MICRO, "mt-2 block text-t-muted-fg")}>{t(c.subtitle, ctx.lang)}</span> : null}
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
    <section id="featured" className="border-y border-t-accent/60 bg-t-muted py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="mb-12 [&_h2]:font-normal [&_span]:tracking-[0.3em]" />
        <ProductGrid products={products} ctx={ctx} layout="minimal" columns={4} className="gap-x-6 gap-y-10 [&_article]:text-center [&_h3]:uppercase [&_h3]:tracking-[0.15em]" />
        <div className="mt-14 text-center">
          <CtaButton value={d.cta} ctx={ctx} className={cn("t-btn bg-t-secondary px-8 text-t-secondary-fg hover:opacity-90", MICRO)} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: champagne split with gold rule ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn(d.align === "left" && "lg:order-2")}>
          {d.eyebrow ? <span className={cn(MICRO, "block text-t-accent")}>{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-5 text-3xl font-normal leading-tight tracking-tight sm:text-4xl">{title}</h2>
          <span className="my-6 block h-px w-20 bg-t-accent" aria-hidden="true" />
          <p className="max-w-md text-sm leading-7 text-t-muted-fg">{t(d.text, ctx.lang)}</p>
          <div className="mt-8">
            <CtaButton value={d.cta} ctx={ctx} className={cn("t-btn bg-t-secondary px-8 text-t-secondary-fg hover:opacity-90", MICRO)} />
          </div>
        </div>
        <div className={cn("border border-t-accent p-3", d.align === "left" && "lg:order-1")}>
          <Img src={d.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Gem className="size-14 text-t-accent" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="bg-t-secondary text-t-accent [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-[0.25em] [&_span]:rounded-none" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className="py-16 sm:py-24 [&_h2]:font-normal [&_span]:rounded-none [&_span]:bg-t-accent/25 [&_span]:text-t-secondary" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-accent/60 bg-t-muted py-16 sm:py-24 [&_h2]:font-normal [&_img]:rounded-none" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={2} take={6} className="py-16 sm:py-24 [&_h2]:font-normal [&_span]:tracking-[0.3em]" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16 [&_dd]:font-normal [&_dt]:uppercase [&_dt]:tracking-[0.2em]" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="py-16 sm:py-24 [&_h2]:font-normal" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-t border-t-accent/60 py-16 sm:py-24 [&_h2]:font-normal" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="pb-20 [&>div>div]:bg-t-secondary [&>div>div]:rounded-none" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
