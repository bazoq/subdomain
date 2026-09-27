/**
 * electronics-01 "Voltify" (#1401) — Modern tech store, blue and clean.
 * Brief: two-tier header (trust strip above, logo + search + cart below) with a category chip row; hero as a
 * scroll-snap product slider with spec bullets and a price-from tag plus two side tiles; product cards show their
 * key specs; brands marquee and a warranty features block; retail grid, blue CTAs, light grey bands.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Laptop, Search, Smartphone } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, BrandsMarquee, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, CategoryChips, EcommerceProviders, PriceTag, QuickAddButton, isInStock, minPrice, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getCategories, getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/** Up to three spec rows for the card (spec table first, then attributes). */
function keySpecs(p: ProductDTO) {
  return [...p.specs, ...p.attributes].filter((x) => x.value).slice(0, 3);
}

function SearchForm({ ctx, className }: { ctx: SiteContext; className?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("flex items-center gap-2", className)}>
      <label className="relative flex-1">
        <span className="sr-only">{t(ui.search, ctx.lang)}</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg" aria-hidden="true" />
        <input type="search" name="q" placeholder={t(sui.searchPlaceholder, ctx.lang)} className="t-input h-11 w-full ps-9" maxLength={80} />
      </label>
      <button type="submit" className="t-btn t-btn-primary h-11 shrink-0 px-4">
        {t(ui.search, ctx.lang)}
      </button>
    </form>
  );
}

/* ---------- Layout: two-tier header + category chips ---------- */
async function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const categories = await getCategories(ctx.tenant.id);
  const trust = (ctx.sections.hero?.data as { badges?: { text: string; icon: string }[] } | undefined)?.badges ?? [];
  const phone = ctx.settings.contact.phone;
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <div className="bg-t-secondary text-t-secondary-fg">
          <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {trust.slice(0, 3).map((b, i) => (
                <li key={i} className="flex items-center gap-1.5 font-medium">
                  <span className="text-t-accent [&_svg]:size-3.5">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
            {phone ? (
              <a href={`tel:${phone}`} className="font-semibold hover:underline">
                <span dir="ltr">{phone}</span>
              </a>
            ) : null}
          </Container>
        </div>
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="[&_nav_a]:font-medium"
          rightSlot={
            <>
              <SearchForm ctx={ctx} className="hidden w-72 lg:flex" />
              <CartButton ctx={lc} mode="drawer" />
            </>
          }
        />
        <div className="border-b border-t-border bg-t-muted">
          <Container className="space-y-3 py-3">
            <SearchForm ctx={ctx} className="lg:hidden" />
            <CategoryChips categories={categories} ctx={lc} />
          </Container>
        </div>
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: snap slider + side tiles ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const tiles = section(ctx, collectionsSection)?.items?.slice(0, 2) ?? [];
  const featured = await getFeaturedProducts(ctx.tenant.id, 12);
  const from = featured.length ? Math.min(...featured.map((p) => minPrice(p))) : null;
  const slides = [...(h.slides ?? []), h.image].filter(Boolean).slice(0, 5);
  const tileIcons = [Smartphone, Laptop];
  return (
    <section className="bg-t-muted py-6 sm:py-8">
      <Container className="grid gap-4 lg:grid-cols-[1.55fr_0.45fr]">
        <div className="relative overflow-hidden rounded-[var(--t-radius)] bg-t-card">
          {slides.length ? (
            <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
              {slides.map((src, i) => (
                <Img key={i} src={src} alt="" className="h-64 w-full shrink-0 snap-center object-cover sm:h-80 lg:h-[26rem]" />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center bg-t-muted sm:h-80 lg:h-[26rem]">
              <Cpu className="size-16 text-t-primary/30" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-t-secondary/90 via-t-secondary/60 to-transparent rtl:bg-gradient-to-l" aria-hidden="true" />
          <div className="absolute inset-y-0 start-0 flex max-w-xl flex-col justify-center p-6 text-t-secondary-fg sm:p-10">
            {h.eyebrow ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-accent-fg">{h.eyebrow}</span> : null}
            <h1 className="font-heading mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{t(h.title, lang)}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 opacity-85 sm:text-base">{t(h.subtitle, lang)}</p>
            {h.badges?.length ? (
              <ul className="mt-5 hidden flex-wrap gap-x-5 gap-y-1.5 text-sm font-medium sm:flex">
                {h.badges.map((b, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-t-accent [&_svg]:size-4">
                      <Icon name={b.icon} />
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              {from ? (
                <span className="rounded-[var(--t-radius)] bg-t-secondary-fg/15 px-3 py-2 text-sm font-semibold backdrop-blur">
                  {t(sui.from, lang)} <span className="font-heading">{formatPKR(from)}</span>
                </span>
              ) : (
                <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline border-t-secondary-fg/40 text-t-secondary-fg hover:bg-t-secondary-fg/10" />
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {tiles.map((c, i) => {
            const I = tileIcons[i % tileIcons.length];
            return (
              <SmartLink
                key={i}
                href={c.href || "/shop"}
                ctx={ctx}
                className="group relative flex min-h-36 flex-1 flex-col justify-between overflow-hidden rounded-[var(--t-radius)] bg-t-card p-5 transition hover:shadow-md"
              >
                {c.image ? <Img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 transition group-hover:opacity-30" /> : null}
                <div className="relative">
                  <I className="size-7 text-t-primary" aria-hidden="true" />
                  <h2 className="font-heading mt-3 text-lg font-bold">{t(c.title, lang)}</h2>
                  {t(c.subtitle, lang) ? <p className="text-sm text-t-muted-fg">{t(c.subtitle, lang)}</p> : null}
                </div>
                <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-t-primary">
                  {t(ui.shop, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
                </span>
              </SmartLink>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: retail tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" />
        <ul className={cn("grid grid-cols-2 gap-4", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card transition hover:border-t-primary hover:shadow-md">
                  <Img src={it.image} alt="" className="aspect-[4/3] w-full bg-t-muted object-cover" fallback={<Cpu className="size-10 text-t-primary/30" />} />
                  <div className="p-4">
                    <h3 className="font-heading text-base font-bold group-hover:text-t-primary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-0.5 text-sm text-t-muted-fg">{sub}</p> : null}
                  </div>
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Product card with key specs ---------- */
function SpecCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const specs = keySpecs(product);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card transition hover:shadow-lg">
      <Link href={href} aria-label={name} className="relative block overflow-hidden bg-t-muted">
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Cpu className="size-12 text-t-primary/30" />} />
        {!inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-t-bg/70">
            <span className="rounded-full bg-t-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-t-secondary-fg">{t(ui.outOfStock, lang)}</span>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        {specs.length ? (
          <ul className="mt-2.5 space-y-1 text-xs text-t-muted-fg">
            {specs.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-1 shrink-0 rounded-full bg-t-primary" aria-hidden="true" />
                <span className="truncate">
                  {s.key}: <span className="font-medium text-t-fg">{s.value}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
          {inStock && !hasVariants ? <QuickAddButton product={product} lang={lang} className="hidden sm:inline-flex" /> : null}
        </div>
      </div>
    </article>
  );
}

async function Products({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d.mode, d.count);
  if (!products.length) return null;
  return (
    <section id="products" className="border-y border-t-border bg-t-muted py-14 sm:py-16">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <SpecCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: light grey split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-14 sm:py-16">
      <Container>
        <div className={cn("grid items-center overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {d.eyebrow ? <span className="t-eyebrow">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full bg-t-muted object-cover lg:aspect-auto" fallback={<Laptop className="size-16 text-t-primary/30" />} />
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
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:text-center [&_li>span:first-child]:mx-auto [&_li>span:first-child]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-14" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
