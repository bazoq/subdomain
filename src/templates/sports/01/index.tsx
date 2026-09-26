/**
 * sports-01 "Pitch Pro" (#1001) — Cricket-first sports store.
 * Brief: green header with white bold nav and yellow cart; big action-photo hero with a heavy headline and
 * category quick-links; brands strip and a "Top picks" horizontal scroller; green bands, yellow CTAs, angled dividers.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Trophy } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AboutBlock,
  AnnouncementBar,
  BrandsMarquee,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  PromoStrip,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
  sectionData,
} from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { CartButton, CartDrawer, EcommerceProviders, ProductCard } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import type { ProductDTO } from "@/modules/ecommerce/types";

/* ---------- section data shapes (ecommerce pack) ---------- */
type CollectionsData = HeadingData & { items?: { title: LocalizedString; subtitle?: LocalizedString; image?: string; href: string }[] };
type FeaturedData = HeadingData & { mode?: string; count?: number; cta?: LinkData };
type BannerData = HeadingData & { text?: LocalizedString; image?: string; cta?: LinkData; align?: string };

async function loadProducts(ctx: SiteContext, d: FeaturedData): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Number(d.count) || 8));
  if (d.mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/** Remap the "dark" surface to the primary green so kit blocks render as green bands (tokens only). */
const GREEN_BAND = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
const ANGLE_BOTTOM = "[clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),0_100%)]";
const ANGLE_BOTH = "[clip-path:polygon(0_2rem,100%_0,100%_calc(100%-2rem),0_100%)]";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lang = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <div className="contents" style={GREEN_BAND}>
          <SiteHeader
            ctx={ctx}
            variant="dark"
            cta={null}
            className="[&_nav_a]:font-bold [&_nav_a]:uppercase [&_nav_a]:tracking-wide"
            rightSlot={
              <>
                <Link href="/shop" className="t-btn t-btn-accent hidden px-4 py-2 text-sm font-bold uppercase md:inline-flex">
                  {t(ui.shop, ctx.lang)}
                </Link>
                <CartButton ctx={lang} mode="drawer" className="bg-t-accent text-t-accent-fg hover:bg-t-accent/90 [&>span]:bg-t-dark [&>span]:text-t-dark-fg" />
              </>
            }
          />
        </div>
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lang} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: action photo + heavy headline + quick links ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const quick = sectionData<CollectionsData>(ctx, collectionsSection)?.items?.slice(0, 4) ?? [];
  return (
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      {h.image ? <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-t-dark via-t-dark/85 to-t-dark/30 rtl:bg-gradient-to-l" aria-hidden="true" />
      <Container className="relative py-24 lg:py-36">
        <div className="t-fade-up max-w-2xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-[var(--t-radius)] bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-widest text-t-accent-fg">
              <Trophy className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/80">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent font-bold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline border-t-dark-fg/40 text-t-dark-fg hover:bg-t-dark-fg/10" />
          </div>
          {quick.length ? (
            <nav aria-label="Categories" className="mt-10 flex flex-wrap gap-2">
              {quick.map((c, i) => (
                <Link
                  key={i}
                  href={c.href || "/shop"}
                  className="inline-flex items-center gap-1 rounded-full border border-t-dark-fg/25 bg-t-dark-fg/10 px-4 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-t-accent hover:text-t-accent-fg"
                >
                  {t(c.title, lang)} <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Link>
              ))}
            </nav>
          ) : null}
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-t-dark-fg/85">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-t-bg [clip-path:polygon(0_100%,100%_0,100%_100%)]" aria-hidden="true" />
    </section>
  );
}

/* ---------- Collections: photo tiles with angled cut ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((c, i) => (
            <Link key={i} href={c.href || "/shop"} className={cn("group relative block aspect-[4/3] overflow-hidden rounded-[var(--t-radius)] bg-t-dark", ANGLE_BOTTOM)}>
              <Img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Trophy className="size-10 opacity-30" />} />
              <div className="absolute inset-0 bg-gradient-to-t from-t-dark via-t-dark/30 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-10 text-t-dark-fg">
                {t(c.subtitle, ctx.lang) ? <span className="inline-block bg-t-accent px-2 py-0.5 text-xs font-bold uppercase text-t-accent-fg">{t(c.subtitle, ctx.lang)}</span> : null}
                <h3 className="font-heading mt-2 text-2xl font-extrabold uppercase">{t(c.title, ctx.lang)}</h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Featured products: "Top picks" horizontal scroller ---------- */
async function TopPicks({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  const more = <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary font-bold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />;
  return (
    <section id="featured" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <div className="hidden sm:block">{more}</div>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} ctx={ctx} showQuickAdd className="w-64 shrink-0 snap-start sm:w-72" />
          ))}
        </div>
        <div className="mt-6 sm:hidden">{more}</div>
      </Container>
    </section>
  );
}

/* ---------- Banner: split with skewed green backdrop ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  const imgLeft = d.align === "left";
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(imgLeft && "lg:order-2")}>
          {d.eyebrow ? <span className="inline-block bg-t-primary px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-t-primary-fg">{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-t-muted-fg">{t(d.text, ctx.lang)}</p>
          <div className="mt-6">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent font-bold uppercase" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <div className={cn("relative", imgLeft && "lg:order-1")}>
          <div className="absolute -inset-3 -skew-y-3 rounded-[var(--t-radius)] bg-t-primary/15" aria-hidden="true" />
          <Img src={d.image} alt="" className="relative aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover" fallback={<Trophy className="size-12 opacity-30" />} />
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
        featuredProducts: () => <TopPicks ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        stats: () => (
          <div className="contents" style={GREEN_BAND}>
            <StatsBlock ctx={ctx} variant="row" light className={cn("py-20 sm:py-24", ANGLE_BOTH)} />
          </div>
        ),
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
