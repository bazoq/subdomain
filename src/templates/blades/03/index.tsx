/**
 * blades-03 "Edge Outdoors" (#603) — Rugged outdoor & hunting knives.
 * Brief: olive header with condensed uppercase nav and an orange "Shop" button; outdoor photo hero with a CSS
 * topographic-line overlay, condensed caps headline and spec badges; product cards with a blade length / steel /
 * weight micro-specs row; features as an icon list on olive; gear-store grid, sharp corners, orange CTAs, dark olive footer.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Layers, Mountain, Ruler, Weight } from "lucide-react";
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

/* topographic contour lines from theme tokens */
const TOPO: React.CSSProperties = {
  backgroundImage:
    "repeating-radial-gradient(ellipse at 30% 65%, transparent 0 22px, color-mix(in srgb, var(--t-accent) 40%, transparent) 22px 23px), repeating-radial-gradient(ellipse at 85% 15%, transparent 0 30px, color-mix(in srgb, var(--t-accent) 30%, transparent) 30px 31px)",
};

const CAPS = "[&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:font-extrabold";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

function spec(p: ProductDTO, re: RegExp): string | null {
  const kv = [...p.specs, ...p.attributes].find((x) => re.test(x.key) && x.value);
  return kv ? kv.value : null;
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
          cta={{ label: ui.shop, href: "/shop" }}
          className="[&>div>a>span]:uppercase [&>div>a>span]:tracking-tight [&_nav_a]:rounded-none [&_nav_a]:font-heading [&_nav_a]:text-base [&_nav_a]:uppercase [&_nav_a]:tracking-wider [&_nav_a[aria-current=page]]:text-t-accent [&_.t-btn]:uppercase [&_.t-btn]:tracking-wider"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-none hover:bg-white/10" />}
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
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
    <section className="relative overflow-hidden bg-t-dark text-t-dark-fg">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" fallback={<Mountain className="size-24 text-t-accent/20" />} />
      <div className="absolute inset-0 opacity-70 mix-blend-screen" style={TOPO} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-t-dark via-t-dark/70 to-t-dark/20" aria-hidden="true" />
      <Container className="relative py-24 lg:py-36">
        <div className="max-w-2xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 border-s-4 border-t-accent ps-3 text-sm font-bold uppercase tracking-[0.25em] text-t-accent">
              <Compass className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/80">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline uppercase tracking-wider text-t-dark-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 border border-t-accent/60 bg-t-dark/60 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-t-dark-fg">
                  <span className="text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: gear-store grid ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className={CAPS} />
        <ul className={cn("grid gap-4 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group block border border-t-border bg-t-card transition hover:border-t-primary">
                  <div className="relative overflow-hidden">
                    <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Mountain className="size-12 text-t-muted-fg/50" />} />
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-t-primary" aria-hidden="true" />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <h3 className="font-heading text-xl font-bold uppercase tracking-wide">{t(it.title, lang)}</h3>
                      {sub ? <p className="text-sm text-t-muted-fg">{sub}</p> : null}
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-t-primary transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
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

/* ---------- Gear card with micro-specs row ---------- */
function GearCard({ product, ctx }: { product: ProductDTO; ctx: SiteContext }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const micro = [
    { Icon: Ruler, v: spec(product, /length|blade/i) },
    { Icon: Layers, v: spec(product, /steel|material/i) },
    { Icon: Weight, v: spec(product, /weight/i) },
  ].filter((m): m is { Icon: typeof Ruler; v: string } => Boolean(m.v));
  return (
    <article className="group flex flex-col border border-t-border bg-t-card transition hover:border-t-primary hover:shadow-md">
      <Link href={href} aria-label={name} className="relative block overflow-hidden bg-t-muted">
        <Img src={product.images[0]} alt={name} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Mountain className="size-12 text-t-muted-fg/50" />} />
        {!inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-t-bg/60">
            <span className="bg-t-dark px-3 py-1 text-xs font-bold uppercase tracking-wide text-t-dark-fg">{t(ui.outOfStock, lang)}</span>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.category ? <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-primary">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading line-clamp-2 text-lg font-bold uppercase leading-tight tracking-wide">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        {micro.length ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-y border-t-border py-2 text-[11px] font-semibold uppercase tracking-wide text-t-muted-fg">
            {micro.map((m, i) => (
              <li key={i} className="inline-flex items-center gap-1">
                <m.Icon className="size-3.5 text-t-primary" /> {m.v}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <PriceTag price={lowest} comparePrice={hasVariants ? null : product.comparePrice} from={hasVariants && lowest < product.price ? t(sui.from, lang) : undefined} />
          {inStock && !hasVariants ? (
            <QuickAddButton product={product} lang={lang} className="hidden sm:inline-flex" />
          ) : inStock ? (
            <Link href={href} className="t-btn t-btn-outline hidden px-3 py-2 text-sm sm:inline-flex">
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
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className={cn("mb-0", CAPS)} />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <GearCard key={p.id} product={p} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Craft: field notes with stencil-numbered steps ---------- */
function CraftNotes({ ctx }: TemplatePageProps) {
  const d = section(ctx, craftSection);
  if (!d) return null;
  const lang = ctx.lang;
  const images = (d.images ?? []).filter(Boolean).slice(0, 2);
  const steps = d.steps ?? [];
  return (
    <section id="craft" className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <div className="absolute -inset-3 opacity-40" style={TOPO} aria-hidden="true" />
          <div className={cn("relative grid gap-3", images.length === 2 && "grid-cols-2")}>
            {(images.length ? images : [""]).map((src, i) => (
              <Img key={i} src={src} alt="" className={cn("w-full border-2 border-t-secondary object-cover", images.length === 2 && i === 1 ? "mt-8 aspect-[3/4]" : "aspect-[4/3]")} fallback={<Mountain className="size-16 text-t-muted-fg/50" />} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className={cn("mb-5", CAPS)} />
          <RichText value={d.body} lang={lang} className="text-t-muted-fg" />
          {steps.length ? (
            <ol className="mt-8 space-y-5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-heading flex size-11 shrink-0 items-center justify-center border-2 border-t-primary text-lg font-extrabold text-t-primary">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-heading text-lg font-bold uppercase tracking-wide">{t(s.title, lang)}</h3>
                    <p className="mt-0.5 text-sm text-t-muted-fg">{t(s.text, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
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
        <div className={cn("grid items-stretch overflow-hidden bg-t-dark text-t-dark-fg lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="relative p-8 sm:p-12">
            <div className="absolute inset-0 opacity-40 mix-blend-screen" style={TOPO} aria-hidden="true" />
            <div className="relative">
              {d.eyebrow ? <span className="border-s-4 border-t-accent ps-3 text-xs font-bold uppercase tracking-[0.25em] text-t-accent">{d.eyebrow}</span> : null}
              <h2 className="font-heading mt-4 text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl">{title}</h2>
              <p className="mt-4 max-w-lg text-t-dark-fg/80">{t(d.text, lang)}</p>
              <div className="mt-8">
                <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary uppercase tracking-wider" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              </div>
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto lg:min-h-[20rem]" fallback={<Mountain className="size-16 text-t-accent/40" />} />
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
        promo: () => <PromoStrip ctx={ctx} className="[&_p]:font-heading [&_p]:text-lg [&_p]:uppercase [&_p]:tracking-wider" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        craft: () => <CraftNotes ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="list" light className={cn("[&_h3]:uppercase [&_h3]:tracking-wide", CAPS)} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className={cn("[&_img]:rounded-none [&_img]:border-2 [&_img]:border-t-secondary [&_img]:shadow-none", CAPS)} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="border-t border-t-dark-fg/10" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className={cn("bg-t-muted", CAPS)} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className={CAPS} />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:font-extrabold [&_h2]:text-4xl sm:[&_h2]:text-5xl" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
