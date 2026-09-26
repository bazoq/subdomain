/**
 * electronics-03 "HomeVolt" (#1403) — Home appliances, solar and inverters; trust-first.
 * Brief: cream header with a teal logotype, prominent phone button and cart; split hero with the appliance image,
 * an installation badge card and a trust strip underneath; banner pitched as solar & inverter packages with a survey
 * CTA; features as service cards; warm neutral surfaces, teal CTAs, orange highlights.
 */
import * as React from "react";
import { ArrowRight, Phone, Plug, Sun, WashingMachine, Wrench } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { brandsSection, featuresSection, heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const phone = ctx.settings.contact.phone;
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="bg-t-muted/95 [&>div>a>span]:text-t-primary [&_nav_a]:font-medium [&_nav_a:hover]:bg-t-primary/10 [&_nav_a:hover]:text-t-primary"
          rightSlot={
            <>
              {phone ? (
                <a href={`tel:${phone}`} className="hidden items-center gap-2 rounded-[var(--t-radius)] border border-t-border bg-t-card px-3 py-2 sm:inline-flex">
                  <Phone className="size-4 text-t-primary" aria-hidden="true" />
                  <span className="leading-tight">
                    <span className="block text-[10px] uppercase tracking-wide text-t-muted-fg">{t(ui.callNow, ctx.lang)}</span>
                    <span className="font-heading block text-sm font-bold">{phone}</span>
                  </span>
                </a>
              ) : null}
              <CartButton ctx={lc} mode="drawer" className="hover:bg-t-primary/10" />
            </>
          }
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: appliance split + trust strip ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const badges = h.badges ?? [];
  return (
    <section className="relative bg-t-muted">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-t-primary">
              <Wrench className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <Img src={h.image} alt="" className="aspect-[4/3] w-full rounded-[1.5rem] bg-t-card object-cover" fallback={<WashingMachine className="size-20 text-t-primary/30" />} />
          {badges[0] ? (
            <div className="absolute -bottom-5 start-4 flex items-center gap-3 rounded-[var(--t-radius)] bg-t-card p-4 shadow-lg">
              <span className="flex size-10 items-center justify-center rounded-full bg-t-accent text-t-accent-fg [&_svg]:size-5">
                <Icon name={badges[0].icon} />
              </span>
              <span className="font-heading text-sm font-bold">{badges[0].text}</span>
            </div>
          ) : null}
        </div>
      </Container>
      {badges.length ? (
        <div className="border-y border-t-border bg-t-card">
          <Container>
            <ul className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
              {badges.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-4">
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

/* ---------- Collections: warm category cards ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className={cn("grid gap-5 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group flex h-full items-center gap-4 rounded-[var(--t-radius)] border border-t-border bg-t-card p-4 transition hover:border-t-primary hover:shadow-md">
                  <Img src={it.image} alt="" className="size-20 shrink-0 rounded-[var(--t-radius)] bg-t-muted object-cover" fallback={<Plug className="size-7 text-t-primary/40" />} />
                  <span className="min-w-0">
                    <h3 className="font-heading text-base font-bold group-hover:text-t-primary">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-0.5 text-sm text-t-muted-fg">{sub}</p> : null}
                    <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-t-primary">
                      {t(ui.shop, lang)} <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </span>
                  </span>
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
    <section id="products" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: solar & inverter lead capture ---------- */
function SolarBanner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  const phone = ctx.settings.contact.phone;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container>
        <div className={cn("grid items-center overflow-hidden rounded-[1.5rem] bg-t-secondary text-t-secondary-fg lg:grid-cols-[1.05fr_0.95fr]", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="relative p-8 sm:p-12">
            <Sun className="absolute -end-6 -top-6 size-40 text-t-accent/20" aria-hidden="true" />
            {d.eyebrow ? (
              <span className="relative inline-flex items-center gap-2 rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-t-accent-fg">
                <Sun className="size-3.5" /> {d.eyebrow}
              </span>
            ) : null}
            <h2 className="font-heading relative mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="relative mt-4 max-w-lg opacity-85">{t(d.text, lang)}</p>
            <div className="relative mt-7 flex flex-wrap gap-3">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              {phone ? (
                <a href={`tel:${phone}`} className="t-btn t-btn-outline border-white/40 text-t-secondary-fg hover:bg-white/10">
                  <Phone className="size-4" /> {phone}
                </a>
              ) : null}
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Sun className="size-16 text-t-accent/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features: service cards ---------- */
function ServiceFeatures({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuresSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="features" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} lang={lang} />
        <ul className={cn("grid gap-5", d.items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
          {d.items.map((it, i) => (
            <li key={i} className="flex h-full flex-col rounded-[1.25rem] border border-t-border bg-t-card p-6 transition hover:shadow-md">
              <span className="flex size-14 items-center justify-center rounded-full bg-t-primary text-t-primary-fg [&_svg]:size-6">
                <Icon name={it.icon} />
              </span>
              <h3 className="font-heading mt-4 text-lg font-bold">{t(it.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-t-muted-fg">{t(it.text, lang)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Brands: quiet name strip ---------- */
function BrandStrip({ ctx }: TemplatePageProps) {
  const d = section(ctx, brandsSection);
  if (!d || !d.logos.length) return null;
  const title = t(d.title, ctx.lang);
  return (
    <section id="brands" className="border-y border-t-border bg-t-muted py-10">
      <Container>
        {title ? <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-t-muted-fg">{title}</p> : null}
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {d.logos.map((l, i) => (
            <li key={i} className="flex h-10 items-center">
              {l.image ? (
                <Img src={l.image} alt={l.name} className="max-h-10 max-w-32 object-contain opacity-70 transition hover:opacity-100" />
              ) : (
                <span className="font-heading text-lg font-bold text-t-muted-fg">{l.name}</span>
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
        promo: () => <PromoStrip ctx={ctx} />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <SolarBanner ctx={ctx} />,
        features: () => <ServiceFeatures ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted [&_img]:rounded-[1.5rem]" />,
        brands: () => <BrandStrip ctx={ctx} />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-14" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
