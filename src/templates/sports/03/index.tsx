/**
 * sports-03 "Active Kids" (#1003) — Kids' sports and school gear, friendly.
 * Brief: blue rounded header with pill nav and an orange cart pill; blob-shaped hero image with a bouncy headline
 * and three colourful badges; collections as circular tiles; testimonials as speech bubbles; extra-rounded cards
 * and alternating pastel bands.
 */
import * as React from "react";
import { ArrowRight, Medal, Smile, Star } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { brandsSection, heroSection, testimonialsSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, Stars, WhatsAppFloat } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock } from "@/modules/shared/ui";
import { getTestimonials } from "@/modules/shared/queries";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

/** Remap the dark surface to the primary blue so header / bands render blue (tokens only). */
const BLUE_BAND = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
const BLOB = "[border-radius:58%_42%_46%_54%/48%_52%_48%_52%]";
const BADGE_TONES = ["bg-t-accent text-t-accent-fg", "bg-t-primary text-t-primary-fg", "bg-t-muted text-t-fg"];

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <div className="contents" style={BLUE_BAND}>
          <SiteHeader
            ctx={ctx}
            variant="dark"
            cta={null}
            className="[&_nav_a]:rounded-full [&_nav_a]:font-bold [&_nav_a:hover]:bg-t-dark-fg/20"
            rightSlot={<CartButton ctx={lc} mode="drawer" showLabel className="bg-t-accent px-4 text-t-accent-fg hover:bg-t-accent/90" />}
          />
        </div>
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: blob image + bouncy headline ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-sm font-extrabold text-t-accent-fg">
              <Smile className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-t-secondary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full text-base font-extrabold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full font-bold text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-3">
              {h.badges.slice(0, 3).map((b, i) => (
                <li key={i} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold shadow-sm", BADGE_TONES[i % BADGE_TONES.length])}>
                  <span className="[&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className={cn("absolute -inset-4 bg-t-accent/40", BLOB)} aria-hidden="true" />
          <Img src={h.image} alt="" className={cn("relative aspect-square w-full object-cover", BLOB)} fallback={<Medal className="size-20 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: circular tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex flex-col items-center text-center">
                  <span className={cn("flex aspect-square w-full items-center justify-center overflow-hidden rounded-full ring-4 ring-transparent transition group-hover:ring-t-accent", i % 2 ? "bg-t-primary/10" : "bg-t-muted")}>
                    {it.image ? (
                      <Img src={it.image} alt="" className="h-full w-full rounded-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <Star className="size-12 text-t-primary" aria-hidden="true" />
                    )}
                  </span>
                  <h3 className="font-heading mt-4 text-lg font-extrabold text-t-secondary group-hover:text-t-primary">{t(it.title, lang)}</h3>
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

/* ---------- Featured products ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d.mode, d.count);
  if (!products.length) return null;
  return (
    <section id="products" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:rounded-[1.75rem] [&_article]:border-2" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-extrabold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: rounded card with a playful blob ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-t-primary p-8 text-t-primary-fg sm:p-12 lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div>
            {d.eyebrow ? <span className="inline-block rounded-full bg-t-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-accent-fg">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-4 text-3xl font-extrabold sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg opacity-90">{t(d.text, lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full font-extrabold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="relative">
            <div className={cn("absolute -inset-3 bg-t-primary-fg/20", BLOB)} aria-hidden="true" />
            <Img src={d.image} alt="" className={cn("relative aspect-[4/3] w-full object-cover", BLOB)} fallback={<Medal className="size-16 opacity-40" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Brands: logo bubbles ---------- */
function BrandBubbles({ ctx }: TemplatePageProps) {
  const d = section(ctx, brandsSection);
  if (!d || !d.logos.length) return null;
  const title = t(d.title, ctx.lang);
  return (
    <section id="brands" className="py-14">
      <Container>
        {title ? <p className="mb-7 text-center text-sm font-extrabold uppercase tracking-[0.15em] text-t-muted-fg">{title}</p> : null}
        <ul className="flex flex-wrap items-center justify-center gap-4">
          {d.logos.map((l, i) => (
            <li key={i} className="flex size-24 items-center justify-center rounded-full border-2 border-t-border bg-t-card p-4 transition hover:border-t-primary">
              {l.image ? (
                <Img src={l.image} alt={l.name} className="max-h-12 max-w-full object-contain" />
              ) : (
                <span className="font-heading text-center text-xs font-extrabold leading-tight text-t-muted-fg">{l.name}</span>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Testimonials as speech bubbles ---------- */
async function Bubbles({ ctx }: TemplatePageProps) {
  const h = section(ctx, testimonialsSection);
  if (!h) return null;
  const rows = await getTestimonials(ctx.tenant.id, 9);
  if (!rows.length) return null;
  return (
    <section id="testimonials" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <li key={r.id}>
              <figure>
                <blockquote
                  className={cn(
                    "relative rounded-[1.75rem] p-6 text-base leading-relaxed shadow-sm",
                    i % 2 ? "bg-t-primary text-t-primary-fg" : "bg-t-card text-t-fg",
                    "after:absolute after:-bottom-3 after:start-8 after:size-6 after:rotate-45 after:rounded-[0.4rem]",
                    i % 2 ? "after:bg-t-primary" : "after:bg-t-card",
                  )}
                >
                  <Stars n={r.rating} className={cn("mb-3", i % 2 && "text-t-accent")} />
                  {t(r.text as LocalizedString, ctx.lang)}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 ps-4">
                  {r.imageUrl ? (
                    <Img src={r.imageUrl} alt="" className="size-11 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-full bg-t-accent font-extrabold text-t-accent-fg">{r.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span>
                    <span className="font-heading block font-extrabold">{r.name}</span>
                    {r.role ? <span className="block text-xs text-t-muted-fg">{r.role}</span> : null}
                  </span>
                </figcaption>
              </figure>
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:rounded-[1.75rem] [&_li]:border-2 [&_span]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted [&_img]:rounded-[2rem]" />,
        brands: () => <BrandBubbles ctx={ctx} />,
        stats: () => (
          <div className="contents" style={BLUE_BAND}>
            <StatsBlock ctx={ctx} variant="cards" light className="[&_.t-card]:rounded-[1.75rem]" />
          </div>
        ),
        testimonials: () => <Bubbles ctx={ctx} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-muted [&>div>div]:rounded-[2.5rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
