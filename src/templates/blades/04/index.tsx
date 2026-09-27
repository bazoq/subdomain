/**
 * blades-04 "Kitchen Steel" (#604) — Chef knives, clean and modern.
 * Brief: white header with a thin nav and teal hover underline, cart right; minimal hero with the knife on white,
 * headline left and feature chips; features as a hairline comparison grid; craft story as 3 vertical cards;
 * clean grid, steel-grey accents, teal buttons.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ChefHat, Ruler, Utensils } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, craftSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag, QuickAddButton, isInStock, minPrice, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/** Blade length / size from the product spec table (kitchen knives are sold by length). */
function lengthOf(p: ProductDTO): string | null {
  const kv = [...p.specs, ...p.attributes].find((x) => /length|size|blade/i.test(x.key) && x.value);
  return kv?.value ?? null;
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
          className="[&_nav]:gap-0 [&_nav_a]:rounded-none [&_nav_a]:border-b-2 [&_nav_a]:border-transparent [&_nav_a]:px-4 [&_nav_a]:text-[13px] [&_nav_a]:font-semibold [&_nav_a]:tracking-wide [&_nav_a:hover]:border-t-primary [&_nav_a:hover]:bg-transparent [&_nav_a:hover]:text-t-primary [&_nav_a[aria-current=page]]:border-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="hover:bg-t-muted" />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="light" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: knife on white, chips under the headline ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-t-primary">
              <span className="h-px w-8 bg-t-primary" aria-hidden="true" />
              {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full border border-t-border bg-t-muted px-3.5 py-1.5 text-sm font-semibold text-t-fg">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute inset-x-6 bottom-6 top-6 rounded-full bg-t-accent/25 blur-2xl" aria-hidden="true" />
          <Img
            src={h.image}
            alt=""
            priority
            className="relative aspect-[4/3] w-full rounded-[var(--t-radius)] bg-t-bg object-contain p-4"
            fallback={<Utensils className="size-16 text-t-accent" />}
          />
        </div>
      </Container>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-t-accent to-transparent" aria-hidden="true" />
    </section>
  );
}

/* ---------- Collections: quiet bordered tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" />
        <ul className={cn("grid gap-5 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card transition hover:border-t-primary">
                  <Img src={it.image} alt="" className="aspect-[5/4] w-full bg-t-muted object-cover" fallback={<ChefHat className="size-10 text-t-accent" />} />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-bold group-hover:text-t-primary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-t-primary">
                      {t(ui.shop, lang)} <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
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

/* ---------- Product card: minimal, quick-add on the image edge ---------- */
function SteelCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const size = lengthOf(product);
  return (
    <article className="group relative flex flex-col">
      <Link href={href} aria-label={name} className="relative block overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-muted transition group-hover:border-t-primary">
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]" fallback={<Utensils className="size-10 text-t-accent" />} />
        {!inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-t-bg/70">
            <span className="rounded-full bg-t-dark px-3 py-1 text-xs font-semibold uppercase tracking-wide text-t-dark-fg">{t(ui.outOfStock, lang)}</span>
          </span>
        ) : null}
        {size ? (
          <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-t-bg/90 px-2 py-0.5 text-[11px] font-semibold text-t-fg">
            <Ruler className="size-3 text-t-primary" /> {size}
          </span>
        ) : null}
      </Link>
      {inStock && !hasVariants ? <QuickAddButton product={product} lang={lang} className="absolute end-2 top-2 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" /> : null}
      <div className="flex flex-1 flex-col pt-3">
        {product.category ? <span className="text-xs text-t-muted-fg">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <div className="mt-2">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} size="sm" />
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
    <section id="products" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <SteelCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Craft: three vertical cards ---------- */
function CraftCards({ ctx }: TemplatePageProps) {
  const d = section(ctx, craftSection);
  if (!d) return null;
  const lang = ctx.lang;
  const images = (d.images ?? []).filter(Boolean);
  const steps = d.steps ?? [];
  return (
    <section id="craft" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="mb-0" />
          <RichText value={d.body} lang={lang} className="text-t-muted-fg" />
        </div>
        {steps.length ? (
          <ol className={cn("mt-12 grid gap-6", steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {steps.map((s, i) => (
              <li key={i} className="flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card">
                <Img src={images[i] ?? images[0]} alt="" className="aspect-[4/3] w-full bg-t-muted object-cover" fallback={<Utensils className="size-10 text-t-accent" />} />
                <div className="flex flex-1 flex-col p-6">
                  <span className="font-heading text-sm font-bold tracking-[0.2em] text-t-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-heading mt-2 text-lg font-bold">{t(s.title, lang)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-t-muted-fg">{t(s.text, lang)}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Features: hairline comparison grid ---------- */
function ComparisonFeatures({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ul className="grid gap-px overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-border sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i} className="flex flex-col gap-3 bg-t-card p-7">
              <span className="flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-5">
                  <Icon name={it.icon} />
                </span>
                <Check className="size-5 text-t-primary" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-base font-bold">{t(it.title, lang)}</h3>
              <p className="text-sm leading-relaxed text-t-muted-fg">{t(it.text, lang)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Banner: split with a steel frame ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(d.align === "left" && "lg:order-2")}>
          {d.eyebrow ? <span className="t-eyebrow">{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
          <div className="mt-7">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <div className={cn("relative", d.align === "left" && "lg:order-1")}>
          <div className="absolute -inset-2 rounded-[var(--t-radius)] border border-t-accent/60" aria-hidden="true" />
          <Img src={d.image} alt="" className="relative aspect-[4/3] w-full rounded-[var(--t-radius)] bg-t-muted object-cover" fallback={<ChefHat className="size-14 text-t-accent" />} />
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
        craft: () => <CraftCards ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <ComparisonFeatures ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-t border-t-border bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
