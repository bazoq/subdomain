/**
 * clothing-03 "Gulaab" (#303) — Soft, feminine boutique for kurtis and modest fashion.
 * Brief: white header with a blush bottom border, a script-style tagline strip under the logo and pill nav;
 * two-column hero with a rotated three-image collage right and a script eyebrow left; collections as circular
 * category bubbles; testimonial carousel framed by oversized quotation marks; rounded-xl cards, soft shadows,
 * pastel section bands and a floral divider line.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flower2, Quote, Sparkles } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, testimonialsSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { getTestimonials } from "@/modules/shared/queries";
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

/** blush floral divider */
function FloralDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-t-accent sm:w-28" />
      <Flower2 className="size-5 text-t-primary" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-t-accent sm:w-28" />
    </div>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const tagline = t((ctx.sections.hero?.data as { eyebrow?: LocalizedString | string } | undefined)?.eyebrow, ctx.lang);
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="border-b-2 border-t-accent [&_nav_a]:rounded-full [&_nav_a]:px-4 [&_nav_a:hover]:bg-t-muted"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-full bg-t-primary px-3 text-t-primary-fg hover:bg-t-primary/90 [&>span]:bg-t-secondary [&>span]:text-t-secondary-fg" />}
        />
        {tagline ? (
          <div className="hidden border-b border-t-border bg-t-muted py-2 text-center sm:block">
            <p className="font-heading text-sm italic tracking-wide text-t-primary">{tagline}</p>
          </div>
        ) : null}
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="light" className="border-t-2 border-t-accent" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: rotated image collage ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const pics = [h.image, ...(h.slides ?? [])].filter((s): s is string => Boolean(s)).slice(0, 3);
  const frames = pics.length ? pics : ["", "", ""];
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <span className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-t-accent/40 blur-2xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-14 py-14 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="font-heading flex items-center gap-2 text-lg italic text-t-primary">
              <Sparkles className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-t-secondary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-t-muted-fg sm:text-lg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-7 text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-3">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full bg-t-muted px-4 py-2 text-xs font-semibold text-t-secondary">
                  <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto h-[24rem] w-full max-w-md sm:h-[28rem] lg:h-[32rem]">
          <div className="absolute start-0 top-4 w-1/2 rotate-[-6deg] overflow-hidden rounded-[1.75rem] shadow-lg">
            <Img src={frames[1] || frames[0]} alt="" className="aspect-[3/4] w-full object-cover" fallback={<Flower2 className="size-10 text-t-primary/40" />} />
          </div>
          <div className="absolute end-0 top-0 w-1/2 rotate-[5deg] overflow-hidden rounded-[1.75rem] shadow-lg">
            <Img src={frames[2] || frames[0]} alt="" className="aspect-[3/4] w-full object-cover" fallback={<Flower2 className="size-10 text-t-primary/40" />} />
          </div>
          <div className="absolute bottom-0 start-1/4 w-3/5 rotate-[2deg] overflow-hidden rounded-[1.75rem] shadow-xl ring-4 ring-t-bg">
            <Img src={frames[0]} alt="" priority className="aspect-[4/5] w-full object-cover" fallback={<Flower2 className="size-12 text-t-primary/40" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: circular bubbles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <FloralDivider />
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="mt-4" />
        <ul className="flex flex-wrap justify-center gap-8 sm:gap-12">
          {d.items.map((c, i) => (
            <li key={i} className="w-28 text-center sm:w-36">
              <Link href={c.href || "/shop"} className="group block">
                <span className="block overflow-hidden rounded-full ring-4 ring-t-accent/60 transition group-hover:ring-t-primary">
                  <Img src={c.image} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110" fallback={<Flower2 className="size-8 text-t-primary/40" />} />
                </span>
                <span className="font-heading mt-4 block text-base font-bold text-t-secondary group-hover:text-t-primary">{t(c.title, ctx.lang)}</span>
                {t(c.subtitle, ctx.lang) ? <span className="mt-0.5 block text-xs text-t-muted-fg">{t(c.subtitle, ctx.lang)}</span> : null}
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
    <section id="featured" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} columns={4} showQuickAdd className="[&_article]:rounded-[1.5rem] [&_article]:border-t-accent/60 [&_article]:shadow-sm [&_article_button]:rounded-full" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
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
        <div className={cn("grid items-center overflow-hidden rounded-[2rem] bg-t-accent/40 lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {t(d.eyebrow, ctx.lang) ? <span className="font-heading text-base italic text-t-primary">{t(d.eyebrow, ctx.lang)}</span> : null}
            <h2 className="font-heading mt-2 text-3xl font-bold leading-tight text-t-secondary sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-md text-base text-t-muted-fg">{t(d.text, ctx.lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Flower2 className="size-14 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Testimonials framed by quotation marks ---------- */
async function Reviews({ ctx }: TemplatePageProps) {
  const rows = await getTestimonials(ctx.tenant.id, 1);
  if (!rows.length) return null;
  const h = sectionData<HeadingData>(ctx, testimonialsSection) ?? {};
  return (
    <section id="testimonials" className="relative overflow-hidden py-16 sm:py-20">
      <Quote className="pointer-events-none absolute -start-4 top-6 size-40 text-t-accent/50 rtl:-scale-x-100" aria-hidden="true" />
      <Quote className="pointer-events-none absolute -end-4 bottom-6 size-40 rotate-180 text-t-accent/50 rtl:-scale-x-100" aria-hidden="true" />
      <Container className="relative">
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} />
        <TestimonialsBlock ctx={ctx} variant="carousel" bare className="[&_.t-card]:rounded-[1.5rem] [&_.t-card]:border-t-accent/60" />
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
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:rounded-[1.5rem] [&_li]:border-t-accent/60 [&_span]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted [&_img]:rounded-[2rem]" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="[&_img]:rounded-[1.25rem]" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_.t-card]:rounded-[1.5rem] [&_.t-card]:border-t-accent/60" />,
        testimonials: () => <Reviews ctx={ctx} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="[&>div>div]:rounded-[2rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
