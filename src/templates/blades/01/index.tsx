/**
 * blades-01 "Damascus Forge" (#601) — Dark, forge-lit craftsmanship.
 * Brief: black header with engraved-style serif logo and amber nav underline; hero over a dark forge photo with an
 * ember glow gradient, Cinzel headline and shipping badge; craft section as a horizontal numbered timeline; product
 * cards with a steel-type chip and a mini spec table; dark, metallic borders, amber accents.
 */
import * as React from "react";
import Link from "next/link";
import { Anvil, ArrowRight, Flame, Swords } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, craftSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag, QuickAddButton, isInStock, minPrice, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

/* ember glow built from theme tokens */
const EMBER: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(60% 55% at 15% 100%, color-mix(in srgb, var(--t-primary) 45%, transparent), transparent 70%), radial-gradient(45% 45% at 85% 95%, color-mix(in srgb, var(--t-accent) 40%, transparent), transparent 70%)",
};

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/** Steel type from specs/attributes (key matching steel/material) or a well-known tag. */
function steelOf(p: ProductDTO): string | null {
  const kv = [...p.specs, ...p.attributes].find((x) => /steel|material/i.test(x.key) && x.value);
  if (kv) return kv.value;
  return p.tags.find((x) => /damascus|1095|d2|440c|5160|vg-?10|aus-?8|52100|carbon|stainless/i.test(x)) ?? null;
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={null}
          className="border-b border-t-border [&>div>a>span]:uppercase [&>div>a>span]:tracking-[0.22em] [&>div>a>span]:text-t-primary [&>div>a>span]:[text-shadow:0_1px_0_var(--t-border)] [&_nav_a]:rounded-none [&_nav_a]:border-b-2 [&_nav_a]:border-transparent [&_nav_a]:uppercase [&_nav_a]:tracking-wider [&_nav_a]:text-xs [&_nav_a:hover]:border-t-primary [&_nav_a:hover]:bg-transparent [&_nav_a[aria-current=page]]:border-t-primary [&_nav_a[aria-current=page]]:text-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="text-t-primary hover:bg-t-dark-fg/10" />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-dark">
      <Img src={h.image} alt="" priority className="absolute inset-0 h-full w-full object-cover opacity-50" fallback={<Flame className="size-24 text-t-primary/20" />} />
      <div className="absolute inset-0" style={EMBER} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/60 to-transparent" aria-hidden="true" />
      <Container className="relative max-w-3xl py-24 text-center lg:py-36">
        {h.badges?.length ? (
          <ul className="mb-8 flex flex-wrap justify-center gap-2">
            {h.badges.map((b, i) => (
              <li key={i} className="inline-flex items-center gap-1.5 border border-t-primary/50 bg-t-dark/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-t-primary">
                <span className="[&_svg]:size-3.5">
                  <Icon name={b.icon} />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
        {t(h.eyebrow, lang) ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.35em] text-t-primary">
            <Anvil className="size-4" /> {t(h.eyebrow, lang)}
          </span>
        ) : null}
        <h1 className="font-heading mt-6 text-4xl font-bold uppercase leading-[1.1] tracking-wide text-t-secondary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wider text-t-secondary" />
        </div>
      </Container>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-t-primary to-transparent" aria-hidden="true" />
    </section>
  );
}

/* ---------- Collections: metallic tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="[&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />
        <ul className={cn("grid gap-4 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group relative block border border-t-border bg-t-card p-1 transition hover:border-t-primary">
                  <span className="absolute -start-px -top-px h-4 w-4 border-s-2 border-t-2 border-t-primary" aria-hidden="true" />
                  <span className="absolute -bottom-px -end-px h-4 w-4 border-b-2 border-e-2 border-t-primary" aria-hidden="true" />
                  <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover opacity-90 transition group-hover:opacity-100" fallback={<Swords className="size-12 text-t-primary/40" />} />
                  <div className="p-4">
                    <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-t-secondary group-hover:text-t-primary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
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

/* ---------- Product card with steel chip + mini spec table ---------- */
function ForgeCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const steel = steelOf(product);
  const specs = product.specs.filter((s) => s.value).slice(0, 2);
  return (
    <article className="group flex flex-col border border-t-border bg-t-card transition hover:border-t-primary/60">
      <Link href={href} aria-label={name} className="relative block overflow-hidden bg-t-muted">
        <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Swords className="size-12 text-t-primary/40" />} />
        {steel ? <span className="absolute start-2 top-2 border border-t-primary/70 bg-t-dark/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-t-primary">{steel}</span> : null}
        {!inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-t-bg/60">
            <span className="bg-t-dark px-3 py-1 text-xs font-semibold uppercase tracking-wide text-t-dark-fg">{t(ui.outOfStock, lang)}</span>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.category ? <span className="text-[11px] uppercase tracking-[0.2em] text-t-muted-fg">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading mt-1 line-clamp-2 text-base font-semibold leading-snug text-t-secondary">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        {specs.length ? (
          <dl className="mt-3 divide-y divide-t-border border-y border-t-border text-xs">
            {specs.map((s) => (
              <div key={s.key} className="flex justify-between gap-3 py-1.5">
                <dt className="text-t-muted-fg">{s.key}</dt>
                <dd className="font-medium text-t-fg">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
          {inStock && !hasVariants ? (
            <QuickAddButton product={product} lang={lang} className="hidden sm:inline-flex" />
          ) : inStock ? (
            <Link href={href} className="t-btn t-btn-outline hidden px-3 py-2 text-sm text-t-primary sm:inline-flex">
              {t(ui.viewDetails, lang)}
            </Link>
          ) : null}
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
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="[&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <ForgeCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wider text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Craft: horizontal numbered timeline ---------- */
function CraftTimeline({ ctx }: TemplatePageProps) {
  const d = section(ctx, craftSection);
  if (!d) return null;
  const lang = ctx.lang;
  const images = (d.images ?? []).filter(Boolean).slice(0, 4);
  const steps = d.steps ?? [];
  const cols = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[Math.min(5, steps.length) as 1 | 2 | 3 | 4 | 5];
  return (
    <section id="craft" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="mb-5 [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />
            <RichText value={d.body} lang={lang} className="text-t-muted-fg" />
          </div>
          {images.length ? (
            <div className={cn("grid gap-3", images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {images.map((src, i) => (
                <Img key={i} src={src} alt="" className={cn("w-full border border-t-border object-cover", images.length === 1 ? "aspect-[4/3]" : "aspect-square")} />
              ))}
            </div>
          ) : null}
        </div>
        {steps.length ? (
          <ol className={cn("relative mt-14 grid gap-8 sm:grid-cols-2", cols)}>
            <span className="absolute inset-x-0 top-5 hidden h-px bg-gradient-to-r from-t-primary/0 via-t-primary to-t-primary/0 lg:block" aria-hidden="true" />
            {steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="font-heading relative flex size-10 items-center justify-center border border-t-primary bg-t-bg text-sm font-bold text-t-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-heading mt-4 text-lg font-semibold uppercase tracking-wide text-t-secondary">{t(s.title, lang)}</h3>
                <p className="mt-1 text-sm text-t-muted-fg">{t(s.text, lang)}</p>
              </li>
            ))}
          </ol>
        ) : null}
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
        <div className={cn("grid items-center border border-t-border bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {t(d.eyebrow, lang) ? <span className="text-xs font-bold uppercase tracking-[0.3em] text-t-primary">{t(d.eyebrow, lang)}</span> : null}
            <h2 className="font-heading mt-3 text-3xl font-bold uppercase tracking-wide text-t-secondary sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0" style={EMBER} aria-hidden="true" />
            <Img src={d.image} alt="" className="relative aspect-[4/3] w-full object-cover" fallback={<Flame className="size-16 text-t-primary/40" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="[&_p]:uppercase [&_p]:tracking-wider" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        craft: () => <CraftTimeline ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="border-y border-t-border bg-t-muted [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary [&_img]:border [&_img]:border-t-border [&_img]:shadow-none" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="border-y border-t-border" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="[&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border bg-t-muted [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-t-secondary" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
