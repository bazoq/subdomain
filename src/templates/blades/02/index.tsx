/**
 * blades-02 "Steelcraft Heritage" (#602) — Museum-like, light, collectors.
 * Brief: parchment header with a centered serif logo + small crest icon and the nav below; museum-plaque hero with
 * centered headline, sword image on a neutral plinth and two CTAs; products presented as "exhibits" with catalogue
 * numbers; craft section as a two-column essay with images; square corners, thin rules, catalogue feel, maroon accents.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, craftSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, RichText, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, PriceTag, QuickAddButton, isInStock, minPrice, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* catalogue-style heading: small caps eyebrow between rules, serif title */
function PlaqueHeading({ eyebrow, title, lang, align = "center", className }: { eyebrow?: string; title?: LocalizedString; lang: "en" | "ur"; align?: "center" | "left"; className?: string }) {
  const ttl = t(title, lang);
  if (!ttl && !eyebrow) return null;
  return (
    <div className={cn("mb-10 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <span className={cn("flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-t-primary", align === "center" && "justify-center")}>
          <span className="h-px w-8 bg-t-border" aria-hidden="true" />
          {eyebrow}
          <span className="h-px w-8 bg-t-border" aria-hidden="true" />
        </span>
      ) : null}
      {ttl ? <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">{ttl}</h2> : null}
    </div>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        {/* masthead: centered crest + serif logotype (desktop) */}
        <div className="hidden border-b border-t-border bg-t-bg lg:block">
          <Container className="flex flex-col items-center py-5">
            <Link href="/" className="flex flex-col items-center gap-2" aria-label={ctx.tenant.name}>
              {ctx.settings.branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-12 w-auto max-w-[220px] object-contain" />
              ) : (
                <>
                  <span className="flex size-9 items-center justify-center border border-t-primary text-t-primary">
                    <Swords className="size-4" />
                  </span>
                  <span className="font-heading text-3xl font-medium tracking-[0.12em] uppercase">{ctx.tenant.name}</span>
                </>
              )}
            </Link>
          </Container>
        </div>
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="bg-t-bg lg:[&>div]:h-12 lg:[&>div]:justify-center lg:[&>div>a:first-child]:hidden [&_nav_a]:rounded-none [&_nav_a]:font-heading [&_nav_a]:text-base [&_nav_a]:uppercase [&_nav_a]:tracking-[0.15em] [&_nav_a:hover]:bg-transparent [&_nav_a:hover]:text-t-primary"
          rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-none" />}
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="light" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: museum plaque ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg py-16 sm:py-24">
      <Container className="text-center">
        {h.eyebrow ? (
          <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">
            <span className="h-px w-10 bg-t-border" aria-hidden="true" />
            {h.eyebrow}
            <span className="h-px w-10 bg-t-border" aria-hidden="true" />
          </span>
        ) : null}
        <h1 className="font-heading mx-auto mt-6 max-w-3xl text-4xl font-medium leading-[1.1] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
        </div>
        {/* exhibit on a plinth */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <Img src={h.image} alt="" className="mx-auto aspect-[16/7] w-full object-contain" fallback={<Swords className="size-20 text-t-primary/30" />} />
          <div className="mx-auto h-7 w-[92%] border border-t-border bg-t-muted shadow-lg" aria-hidden="true" />
          <div className="mx-auto h-3 w-[97%] border-x border-b border-t-border bg-t-border/60" aria-hidden="true" />
        </div>
        {h.badges?.length ? (
          <div className="mx-auto mt-8 inline-block border border-t-border bg-t-muted p-1.5">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border border-t-accent/60 px-6 py-2 text-xs uppercase tracking-[0.25em] text-t-muted-fg">
              {h.badges.map((b, i) => (
                <li key={i}>{b.text}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- Collections: catalogue sections ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <PlaqueHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className={cn("grid gap-6 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group block border border-t-border bg-t-card p-3 transition hover:border-t-primary">
                  <div className="relative bg-t-muted">
                    <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Swords className="size-10 text-t-primary/40" />} />
                    <span className="absolute start-2 top-2 bg-t-card px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-t-muted-fg">{ROMAN[i] ?? i + 1}</span>
                  </div>
                  <h3 className="font-heading mt-3 text-xl font-medium group-hover:text-t-primary">{t(it.title, lang)}</h3>
                  {sub ? <p className="mt-0.5 text-sm text-t-muted-fg">{sub}</p> : null}
                </SmartLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Exhibit card with catalogue number ---------- */
function ExhibitCard({ product, ctx, index }: { product: ProductDTO; ctx: SiteContext; index: number }) {
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const href = `/shop/${product.slug}`;
  const inStock = isInStock(product);
  const hasVariants = product.variants.length > 0;
  const lowest = minPrice(product);
  const cat = product.sku || String(index + 1).padStart(3, "0");
  return (
    <article className="group flex flex-col border border-t-border bg-t-card transition hover:border-t-primary">
      <Link href={href} aria-label={name} className="relative block bg-t-muted p-6">
        <Img src={product.images[0]} alt={name} className="aspect-[4/3] w-full object-contain transition duration-500 group-hover:scale-[1.03]" fallback={<Swords className="size-12 text-t-primary/40" />} />
        <span className="absolute start-3 top-3 font-mono text-[11px] uppercase tracking-widest text-t-muted-fg">No. {cat}</span>
        {!inStock ? <span className="absolute end-3 top-3 bg-t-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-t-dark-fg">{t(ui.outOfStock, lang)}</span> : null}
      </Link>
      <div className="flex flex-1 flex-col border-t border-t-border p-4">
        {product.category ? <span className="text-[11px] uppercase tracking-[0.25em] text-t-accent">{t(product.category.name, lang)}</span> : null}
        <h3 className="font-heading mt-1 line-clamp-2 text-lg font-medium leading-snug">
          <Link href={href} className="hover:text-t-primary">
            {name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-dashed border-t-border pt-3">
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
    <section id="products" className="py-16 sm:py-20">
      <Container>
        <PlaqueHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p, i) => (
            <ExhibitCard key={p.id} product={p} ctx={ctx} index={i} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Craft: two-column essay ---------- */
function CraftEssay({ ctx }: TemplatePageProps) {
  const d = section(ctx, craftSection);
  if (!d) return null;
  const lang = ctx.lang;
  const images = (d.images ?? []).filter(Boolean).slice(0, 4);
  const steps = d.steps ?? [];
  return (
    <section id="craft" className="border-y border-t-border bg-t-muted py-16 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <PlaqueHeading eyebrow={d.eyebrow} title={d.title} lang={lang} align="left" className="mb-6" />
          <RichText
            value={d.body}
            lang={lang}
            className="text-lg leading-8 text-t-fg/85 [&>p:first-child::first-letter]:float-start [&>p:first-child::first-letter]:me-2 [&>p:first-child::first-letter]:font-heading [&>p:first-child::first-letter]:text-6xl [&>p:first-child::first-letter]:leading-[0.8] [&>p:first-child::first-letter]:text-t-primary"
          />
          {steps.length ? (
            <ol className="mt-8 divide-y divide-t-border border-y border-t-border">
              {steps.map((s, i) => (
                <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 py-4">
                  <span className="font-heading text-2xl italic text-t-primary">{ROMAN[i] ?? i + 1}</span>
                  <div>
                    <h3 className="font-heading text-lg font-medium">{t(s.title, lang)}</h3>
                    <p className="mt-1 text-sm text-t-muted-fg">{t(s.text, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4 self-start">
          {images.length ? (
            images.map((src, i) => (
              <figure key={i} className={cn("border border-t-border bg-t-card p-2", i === 0 && "col-span-2")}>
                <Img src={src} alt="" className={cn("w-full object-cover", i === 0 ? "aspect-[4/3]" : "aspect-square")} />
              </figure>
            ))
          ) : (
            <figure className="col-span-2 border border-t-border bg-t-card p-2">
              <Img src="" alt="" className="aspect-[4/3] w-full" fallback={<Swords className="size-16 text-t-primary/30" />} />
            </figure>
          )}
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
        <div className={cn("grid items-center gap-8 border-y border-t-border py-8 lg:grid-cols-2 lg:gap-12", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="px-2 sm:px-6">
            {d.eyebrow ? <span className="text-xs font-semibold uppercase tracking-[0.3em] text-t-primary">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-3 text-3xl font-medium sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="border border-t-border bg-t-card p-2">
            <Img src={d.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Swords className="size-16 text-t-primary/30" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
const SERIF = "[&_h2]:font-medium [&_.t-eyebrow]:tracking-[0.3em]";

function Home({ ctx }: TemplatePageProps) {
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        promo: () => <PromoStrip ctx={ctx} className="border-y border-t-border [&_p]:font-heading [&_p]:text-lg" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        craft: () => <CraftEssay ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={3} className={cn("bg-t-muted [&_li]:rounded-none [&_li_span]:rounded-none", SERIF)} />,
        about: () => <AboutBlock ctx={ctx} variant="split" className={cn("[&_img]:rounded-none [&_img]:border [&_img]:border-t-border [&_img]:p-2 [&_img]:shadow-none", SERIF)} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" className="border-y border-t-border bg-t-muted" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className={SERIF} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className={cn("border-t border-t-border bg-t-muted", SERIF)} />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:font-medium" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
