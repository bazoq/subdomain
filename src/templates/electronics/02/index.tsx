/**
 * electronics-02 "Nightshift" (#1402) — Gaming and gadgets, dark neon.
 * Brief: dark header closed by a neon gradient hairline; hero lit by violet/cyan gradient orbs with a pulsing glow
 * behind the primary CTA; gradient-border product cards with monospace spec chips; neon brand plates; dark surfaces,
 * gradient borders, tight grid.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Gamepad2, Headphones, Zap } from "lucide-react";
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

/** Neon orbs built from theme tokens only. */
const ORBS: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(45% 45% at 20% 20%, color-mix(in srgb, var(--t-primary) 45%, transparent), transparent 70%)",
    "radial-gradient(40% 40% at 85% 30%, color-mix(in srgb, var(--t-accent) 35%, transparent), transparent 70%)",
    "radial-gradient(55% 40% at 60% 100%, color-mix(in srgb, var(--t-primary) 30%, transparent), transparent 70%)",
  ].join(","),
};

const GRADIENT_EDGE = "rounded-[var(--t-radius)] bg-gradient-to-br from-t-primary/70 via-t-accent/40 to-t-border p-px";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

function specChips(p: ProductDTO) {
  return [...p.specs, ...p.attributes].filter((x) => x.value).slice(0, 3);
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <div className="sticky top-0 z-50">
          <SiteHeader
            ctx={ctx}
            variant="dark"
            sticky={false}
            cta={null}
            className="[&>div>a>span]:uppercase [&>div>a>span]:tracking-[0.12em] [&_nav_a]:text-xs [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-[0.15em] [&_nav_a:hover]:bg-t-primary/20 [&_nav_a:hover]:text-t-accent"
            rightSlot={<CartButton ctx={lc} mode="drawer" className="hover:bg-t-primary/25" />}
          />
          <div className="h-px w-full bg-gradient-to-r from-t-primary via-t-accent to-t-primary" aria-hidden="true" />
        </div>
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" className="border-t border-t-border" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: gradient orbs + pulsing CTA glow ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-dark">
      <div className="absolute inset-0" style={ORBS} aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-t-accent/60 bg-t-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-t-accent">
              <Zap className="size-3.5" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-3xl font-bold uppercase leading-[1.15] tracking-tight text-t-secondary sm:text-4xl lg:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <span className="relative inline-flex">
              <span className="absolute -inset-2 animate-pulse rounded-full bg-t-primary/40 blur-lg" aria-hidden="true" />
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary relative uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </span>
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wider text-t-accent" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 rounded-[var(--t-radius)] border border-t-border bg-t-card/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-t-muted-fg">
                  <span className="text-t-accent [&_svg]:size-3.5">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className={cn("relative", GRADIENT_EDGE)}>
          <Img
            src={h.image}
            alt=""
            priority
            className="aspect-[4/3] w-full rounded-[var(--t-radius)] bg-t-card object-cover"
            fallback={<Gamepad2 className="size-20 text-t-primary/50" />}
          />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: glow tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="[&_h2]:uppercase [&_h2]:tracking-tight" />
        <ul className={cn("grid gap-4 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i} className={cn("group transition hover:from-t-accent hover:via-t-primary", GRADIENT_EDGE)}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] bg-t-card">
                  <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover opacity-85 transition group-hover:opacity-100" fallback={<Headphones className="size-10 text-t-primary/50" />} />
                  <div className="p-5">
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-t-secondary group-hover:text-t-accent">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 font-mono text-xs uppercase tracking-wide text-t-muted-fg">{sub}</p> : null}
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

/* ---------- Product card: gradient edge + monospace spec chips ---------- */
function NeonCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const chips = specChips(product);
  return (
    <article className={cn("group h-full transition hover:from-t-accent hover:via-t-primary", GRADIENT_EDGE)}>
      <div className="flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] bg-t-card">
        <Link href={href} aria-label={name} className="relative block overflow-hidden bg-t-muted">
          <Img src={product.images[0]} alt={name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Cpu className="size-12 text-t-primary/50" />} />
          {!inStock ? (
            <span className="absolute inset-0 flex items-center justify-center bg-t-bg/70">
              <span className="rounded-[var(--t-radius)] bg-t-primary px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-t-primary-fg">{t(ui.outOfStock, lang)}</span>
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug text-t-secondary">
            <Link href={href} className="hover:text-t-accent">
              {name}
            </Link>
          </h3>
          {chips.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <li key={c.key} className="rounded border border-t-border bg-t-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-t-muted-fg">
                  {c.value}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
            {inStock && !hasVariants ? <QuickAddButton product={product} lang={lang} className="hidden sm:inline-flex" /> : null}
          </div>
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
    <section id="products" className="border-y border-t-border bg-t-muted/40 py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} className="[&_h2]:uppercase [&_h2]:tracking-tight" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <NeonCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wider text-t-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: neon split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={GRADIENT_EDGE}>
          <div className={cn("relative grid items-center overflow-hidden rounded-[var(--t-radius)] bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:nth-child(2)]:order-1")}>
            <div className="absolute inset-0" style={ORBS} aria-hidden="true" />
            <div className="relative p-8 sm:p-12">
              {t(d.eyebrow, lang) ? <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-t-accent">{t(d.eyebrow, lang)}</span> : null}
              <h2 className="font-heading mt-3 text-2xl font-bold uppercase leading-tight tracking-tight text-t-secondary sm:text-3xl">{title}</h2>
              <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
              <div className="mt-8">
                <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              </div>
            </div>
            <Img src={d.image} alt="" className="relative aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Gamepad2 className="size-16 text-t-primary/50" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features: neon icon plates ---------- */
function Features({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} className="[&_h2]:uppercase [&_h2]:tracking-tight" />
        <ul className={cn("grid gap-4", d.items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <li key={i} className={GRADIENT_EDGE}>
              <div className="h-full rounded-[var(--t-radius)] bg-t-card p-6">
                <span className="flex size-12 items-center justify-center rounded-[var(--t-radius)] border border-t-accent/40 bg-t-accent/10 text-t-accent [&_svg]:size-6">
                  <Icon name={it.icon} />
                </span>
                <h3 className="font-heading mt-4 text-base font-bold uppercase tracking-wide text-t-secondary">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(it.text, lang)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Brands: neon plates ---------- */
function BrandPlates({ ctx }: TemplatePageProps) {
  const d = section(ctx, brandsSection);
  if (!d || !d.logos.length) return null;
  const title = t(d.title, ctx.lang);
  return (
    <section id="brands" className="border-y border-t-border py-12">
      <Container>
        {title ? <p className="mb-6 text-center font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-t-muted-fg">{title}</p> : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {d.logos.map((l, i) => (
            <li key={i} className="flex h-16 items-center justify-center rounded-[var(--t-radius)] border border-t-border bg-t-card px-3 transition hover:border-t-accent/60">
              {l.image ? (
                <Img src={l.image} alt={l.name} className="max-h-8 max-w-full object-contain opacity-75 transition hover:opacity-100" />
              ) : (
                <span className="font-heading text-center text-xs font-bold uppercase tracking-wide text-t-muted-fg">{l.name}</span>
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
        promo: () => <PromoStrip ctx={ctx} className="[&_p]:font-mono [&_p]:uppercase [&_p]:tracking-wide" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <Features ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted/40 [&_h2]:uppercase [&_h2]:tracking-tight" />,
        brands: () => <BrandPlates ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" light className="py-14" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="[&_h2]:uppercase [&_h2]:tracking-tight" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border bg-t-muted/40 [&_h2]:uppercase [&_h2]:tracking-tight" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
