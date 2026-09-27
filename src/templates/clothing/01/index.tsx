/**
 * clothing-01 "Zarnish" (#301) — Luxury lawn & pret, editorial fashion.
 * Brief: minimal header with a tiny uppercase nav, centred serif logotype and icons right that hides on
 * scroll down and returns on scroll up; full-screen image slider hero (hero.slides) with vertical eyebrow
 * text, the headline bottom-left and a thin outline CTA; collections as two tall side-by-side panels with
 * hover zoom; lookbook masonry from the gallery; black/white with gold accents, square corners, uppercase
 * letter-spaced labels and editorial spacing.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Shirt } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, StatsBlock, TestimonialsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { CartDrawer, EcommerceProviders, ProductGrid } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import type { ProductDTO } from "@/modules/ecommerce/types";
import { EditorialHeader } from "./header";

const SLIDE = ls("Slide", "سلائیڈ");

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

const LABEL = "text-[10px] font-semibold uppercase tracking-[0.3em]";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <EditorialHeader ctx={ctx} />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:tracking-[0.25em] [&_h3]:text-t-accent" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: full-screen scroll-snap slider ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const slides = [h.image, ...(h.slides ?? [])].filter((s): s is string => Boolean(s));
  const frames = slides.length ? slides.slice(0, 5) : [""];
  return (
    <section aria-label={t(h.title, lang)}>
      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {frames.map((src, i) => (
          <div key={i} id={`zarnish-slide-${i}`} className="relative flex min-h-[calc(100vh-4rem)] w-full shrink-0 snap-center items-end bg-t-dark text-t-dark-fg lg:min-h-[calc(100vh-5rem)]">
            <Img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Shirt className="size-24 opacity-20" />} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" aria-hidden="true" />
            {h.eyebrow ? (
              <span className={cn("absolute end-6 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] text-t-accent", LABEL)} aria-hidden={i > 0}>
                {h.eyebrow}
              </span>
            ) : null}
            <Container className="relative pb-16 sm:pb-24">
              <div className="max-w-2xl t-fade-up">
                {i === 0 ? (
                  <>
                    <h1 className="font-heading text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-t-dark-fg/80 sm:text-base">{t(h.subtitle, lang)}</p>
                  </>
                ) : (
                  <p className="font-heading text-3xl font-light leading-tight tracking-tight sm:text-5xl">{t(h.subtitle, lang)}</p>
                )}
                <div className="mt-8 flex flex-wrap gap-4">
                  <CtaButton value={h.primaryCta} ctx={ctx} className={cn("t-btn t-btn-outline border-t-dark-fg/60 px-8 text-t-dark-fg hover:bg-t-dark-fg hover:text-t-dark", LABEL)} />
                  <CtaButton value={h.secondaryCta} ctx={ctx} className={cn("inline-flex items-center gap-2 border-b border-t-accent pb-1 text-t-accent", LABEL)} />
                </div>
              </div>
            </Container>
          </div>
        ))}
      </div>
      {frames.length > 1 ? (
        <div className="flex justify-center gap-6 border-b border-t-border py-4">
          {frames.map((_, i) => (
            <a key={i} href={`#zarnish-slide-${i}`} className={cn("text-t-muted-fg transition hover:text-t-accent", LABEL)} aria-label={`${t(SLIDE, lang)} ${i + 1}`}>
              {String(i + 1).padStart(2, "0")}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Collections: two tall panels with hover zoom ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-10 [&_h2]:font-light [&_span]:tracking-[0.3em]" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className="group relative block aspect-[3/4] overflow-hidden bg-t-muted">
                <Img src={c.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" fallback={<Shirt className="size-12 opacity-25" />} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 p-7 text-white">
                  {t(c.subtitle, ctx.lang) ? <span className={cn("block text-t-accent", LABEL)}>{t(c.subtitle, ctx.lang)}</span> : null}
                  <span className="font-heading mt-2 block text-2xl font-light tracking-tight sm:text-4xl">{t(c.title, ctx.lang)}</span>
                  <span className={cn("mt-4 inline-flex items-center gap-2 border-b border-white/70 pb-1", LABEL)}>
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
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

/* ---------- Featured products: minimal editorial grid ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="border-y border-t-border py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="mb-12 [&_h2]:font-light [&_span]:tracking-[0.3em]" />
        <ProductGrid products={products} ctx={ctx} layout="minimal" columns={4} className="gap-x-5 gap-y-10 [&_h3]:uppercase [&_h3]:tracking-[0.12em]" />
        <div className="mt-14 text-center">
          <CtaButton value={d.cta} ctx={ctx} className={cn("t-btn t-btn-outline px-8 text-t-fg", LABEL)} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: full-bleed campaign image ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="relative flex min-h-[32rem] items-center justify-center overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Shirt className="size-20 opacity-20" />} />
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
      <Container className="relative py-20 text-center">
        {d.eyebrow ? <span className={cn("block text-t-accent", LABEL)}>{d.eyebrow}</span> : null}
        <h2 className="font-heading mx-auto mt-5 max-w-2xl text-3xl font-light leading-tight tracking-tight sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-t-dark-fg/80">{t(d.text, ctx.lang)}</p>
        <div className="mt-9">
          <CtaButton value={d.cta} ctx={ctx} className={cn("t-btn t-btn-outline border-t-dark-fg/60 px-8 text-t-dark-fg hover:bg-t-dark-fg hover:text-t-dark", LABEL)} />
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
        promo: () => <PromoStrip ctx={ctx} className="bg-t-dark text-t-dark-fg [&_p]:text-xs [&_p]:uppercase [&_p]:tracking-[0.25em]" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" className="py-20 sm:py-28 [&_h2]:font-light [&_span]:rounded-none" />,
        about: () => <AboutBlock ctx={ctx} variant="centered" className="border-y border-t-border bg-t-muted py-20 sm:py-28 [&_h2]:font-light" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} take={12} className="py-20 sm:py-28 [&_h2]:font-light [&_span]:tracking-[0.3em]" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16 sm:py-20 [&_dd]:font-light" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="py-20 sm:py-28 [&_h2]:font-light" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border py-20 sm:py-28 [&_h2]:font-light" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="py-16 sm:py-20" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
