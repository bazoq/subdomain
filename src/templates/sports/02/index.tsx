/**
 * sports-02 "IronWorks" (#1002) — Fitness equipment, dark and heavy.
 * Brief: black header with a condensed logo and red underline nav; dark gym-photo hero cut by a red diagonal
 * stripe with a huge headline and a plate-chip badge row; product cards carry weight/size chips; features as a
 * red-numbered list; charcoal surfaces, amber prices, big type.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Dumbbell, Flame, Weight } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { brandsSection, featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
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

/** Weight / size chips from the spec table (dumbbells, plates and racks are sold by these). */
function specChips(p: ProductDTO): { key: string; value: string }[] {
  return [...p.specs, ...p.attributes].filter((x) => x.value && /weight|kg|size|length|load|resistance|material/i.test(x.key)).slice(0, 2);
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
          variant="dark"
          cta={null}
          className="[&>div>a>span]:uppercase [&_nav_a]:rounded-none [&_nav_a]:border-b-[3px] [&_nav_a]:border-transparent [&_nav_a]:text-xs [&_nav_a]:font-bold [&_nav_a]:uppercase [&_nav_a]:tracking-[0.18em] [&_nav_a:hover]:border-t-primary [&_nav_a:hover]:bg-transparent [&_nav_a[aria-current=page]]:border-t-primary [&_nav_a[aria-current=page]]:text-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-none bg-t-primary text-t-primary-fg hover:bg-t-primary/90" />}
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: gym photo + red diagonal stripe ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-dark">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" fallback={<Dumbbell className="size-24 text-t-primary/30" />} />
      <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/70 to-t-bg/20" aria-hidden="true" />
      <div className="absolute -start-24 top-1/3 h-24 w-[140%] -rotate-6 bg-t-primary/80" aria-hidden="true" />
      <Container className="relative py-24 lg:py-32">
        <div className="max-w-3xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">
              <Flame className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-5xl uppercase leading-[0.9] tracking-tight text-t-secondary sm:text-6xl lg:text-8xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-none uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-none uppercase tracking-wider text-t-secondary" />
          </div>
        </div>
      </Container>
      {h.badges?.length ? (
        <div className="relative border-t border-t-border bg-t-dark/80">
          <Container>
            <ul className="flex flex-wrap items-center gap-x-10 gap-y-3 py-4">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-t-secondary">
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-t-accent text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </Container>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Collections: heavy tiles with a red corner label ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="[&_h2]:uppercase" />
        <ul className={cn("grid gap-4 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group relative flex h-full flex-col overflow-hidden border border-t-border bg-t-card transition hover:border-t-primary">
                  <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover opacity-80 transition group-hover:opacity-100" fallback={<Dumbbell className="size-12 text-t-primary/40" />} />
                  {sub ? <span className="absolute start-0 top-4 bg-t-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-t-primary-fg">{sub}</span> : null}
                  <div className="p-5">
                    <h3 className="font-heading text-xl uppercase leading-none text-t-secondary group-hover:text-t-primary">{t(it.title, lang)}</h3>
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

/* ---------- Product card with weight / size chips ---------- */
function IronCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const chips = specChips(product);
  return (
    <article className="group flex flex-col border border-t-border bg-t-card transition hover:border-t-primary">
      <Link href={href} aria-label={name} className="relative block overflow-hidden bg-t-muted">
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Weight className="size-12 text-t-primary/40" />} />
        {!inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-t-bg/70">
            <span className="bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-primary-fg">{t(ui.outOfStock, lang)}</span>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading line-clamp-2 text-base uppercase leading-tight text-t-secondary">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        {chips.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <li key={c.key} className="inline-flex items-center gap-1 border border-t-border bg-t-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-t-muted-fg">
                <Weight className="size-3 text-t-accent" /> {c.value}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
          {inStock && !hasVariants ? <QuickAddButton product={product} lang={lang} className="hidden rounded-none sm:inline-flex" /> : null}
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
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="[&_h2]:uppercase" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <IronCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-none uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: red slab split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-stretch border border-t-border lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="bg-t-primary p-8 text-t-primary-fg sm:p-12">
            {d.eyebrow ? <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-3 text-3xl uppercase leading-none sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-lg opacity-90">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-none uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Dumbbell className="size-16 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features: red-numbered list ---------- */
function NumberedFeatures({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} align="left" className="[&_h2]:uppercase" />
        <ol className="divide-y divide-t-border border-y border-t-border">
          {d.items.map((it, i) => (
            <li key={i} className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:gap-8">
              <span className="font-heading text-4xl leading-none text-t-primary sm:w-24 sm:text-5xl">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex size-11 shrink-0 items-center justify-center border border-t-border bg-t-card text-t-accent [&_svg]:size-5">
                <Icon name={it.icon} />
              </span>
              <div className="sm:flex-1">
                <h3 className="font-heading text-xl uppercase leading-none text-t-secondary">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(it.text, lang)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Brands: bordered logo boxes ---------- */
function BrandBoxes({ ctx }: TemplatePageProps) {
  const d = section(ctx, brandsSection);
  if (!d || !d.logos.length) return null;
  const title = t(d.title, ctx.lang);
  return (
    <section id="brands" className="py-14">
      <Container>
        {title ? <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.25em] text-t-muted-fg">{title}</p> : null}
        <ul className="grid grid-cols-2 gap-px bg-t-border sm:grid-cols-3 lg:grid-cols-6">
          {d.logos.map((l, i) => (
            <li key={i} className="flex h-20 items-center justify-center bg-t-card px-4">
              {l.image ? (
                <Img src={l.image} alt={l.name} className="max-h-10 max-w-full object-contain opacity-70 transition hover:opacity-100" />
              ) : (
                <span className="font-heading text-base uppercase tracking-wide text-t-muted-fg">{l.name}</span>
              )}
            </li>
          ))}
        </ul>
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
        promo: () => <PromoStrip ctx={ctx} className="[&_p]:font-bold [&_p]:uppercase [&_p]:tracking-wider" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <NumberedFeatures ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_h2]:uppercase" />,
        brands: () => <BrandBoxes ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-16 sm:py-20" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={2} className="bg-t-muted [&_h2]:uppercase" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_h2]:uppercase" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
