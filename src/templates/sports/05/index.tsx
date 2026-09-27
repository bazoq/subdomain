/**
 * sports-05 "Court Club" (#1005) — Racket sports and team kits, clean.
 * Brief: white header with navy nav and a neon "Team kits" button; split hero with a neon accent shape behind the
 * image and two CTAs; banner pitched as custom team kits with a quote CTA; brands marquee; clean navy/neon grid
 * with rounded-lg cards.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Shirt, Users } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, BrandsMarquee, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

const TEAM_KITS = ls("Team kits", "ٹیم کٹس");

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
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="[&>div>a>span]:text-t-secondary [&_nav_a]:font-semibold [&_nav_a]:text-t-secondary [&_nav_a:hover]:bg-t-muted [&_nav_a:hover]:text-t-primary"
          rightSlot={
            <>
              <Link href="#banner" className="t-btn t-btn-accent hidden px-4 py-2 text-sm font-bold sm:inline-flex">
                <Shirt className="size-4" /> {t(TEAM_KITS, ctx.lang)}
              </Link>
              <CartButton ctx={lc} mode="drawer" />
            </>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="primary" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: split with a neon shape behind the image ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? <span className="inline-block rounded-full bg-t-accent px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-t-accent-fg">{t(h.eyebrow, lang)}</span> : null}
          <h1 className="font-heading mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-t-secondary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold text-t-secondary">
                  <span className="flex size-8 items-center justify-center rounded-full bg-t-muted text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -end-6 -top-6 size-48 rounded-full bg-t-accent" aria-hidden="true" />
          <div className="absolute -bottom-6 -start-6 h-32 w-32 rounded-[var(--t-radius)] bg-t-primary/10" aria-hidden="true" />
          <Img src={h.image} alt="" priority className="relative aspect-[4/5] w-full rounded-[2rem] object-cover" fallback={<Users className="size-16 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: clean cards with a neon rule ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className={cn("grid gap-6 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex h-full flex-col overflow-hidden rounded-[var(--t-radius)] bg-t-muted transition hover:shadow-lg">
                  <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Shirt className="size-10 text-t-primary/30" />} />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-extrabold text-t-secondary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
                    <span className="mt-4 block h-1 w-10 rounded-full bg-t-accent transition-all group-hover:w-20" aria-hidden="true" />
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

/* ---------- Featured products: clean minimal grid ---------- */
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
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid products={products} ctx={ctx} layout="minimal" showQuickAdd columns={4} />
      </Container>
    </section>
  );
}

/* ---------- Banner: custom team kits, lead CTA ---------- */
function TeamKitsBanner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-t-secondary p-8 text-t-secondary-fg sm:p-12 lg:grid-cols-[1.05fr_0.95fr]", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="absolute -end-16 -top-16 size-56 rounded-full bg-t-accent/25" aria-hidden="true" />
          <div className="relative">
            {t(d.eyebrow, lang) ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-t-accent-fg">
                <Users className="size-3.5" /> {t(d.eyebrow, lang)}
              </span>
            ) : null}
            <h2 className="font-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg opacity-85">{t(d.text, lang)}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <SmartLink href="/shop" ctx={ctx} className="t-btn t-btn-outline border-t-secondary-fg/40 text-t-secondary-fg hover:bg-t-secondary-fg/10">
                {t(ui.shop, lang)}
              </SmartLink>
            </div>
          </div>
          <div className="relative">
            <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" fallback={<Shirt className="size-14 opacity-40" />} />
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <TeamKitsBanner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li>span:first-child]:bg-t-accent [&_li>span:first-child]:text-t-accent-fg" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="border-y border-t-border bg-t-muted" />,
        brands: () => <BrandsMarquee ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" light className="py-16" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="border-t border-t-border bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
