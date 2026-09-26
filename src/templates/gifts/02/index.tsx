/**
 * gifts-02 "Noor Hampers" (#502) — Premium hampers, Eid & corporate.
 * Brief: emerald header with gold logotype, nav right and an outlined "Corporate orders" button; dark emerald
 * hero with gold serif headline, hamper image in a gold-bordered frame and trust badges; banner pitched as
 * "Corporate & bulk gifting" with a lead CTA; gold divider ornaments; formal, symmetric, gold hairlines, emerald footer.
 */
import * as React from "react";
import { ArrowRight, Gift, Package } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { ls, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

const CORPORATE = ls("Corporate orders", "کارپوریٹ آرڈرز");

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* gold ornament: rule — diamond — rule */
function GoldRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden="true">
      <span className="h-px w-16 bg-t-accent" />
      <span className="size-2 rotate-45 bg-t-accent" />
      <span className="h-px w-16 bg-t-accent" />
    </div>
  );
}

function FormalHeading({ eyebrow, title, light, lang }: { eyebrow?: string; title?: { en: string; ur?: string }; light?: boolean; lang: "en" | "ur" }) {
  const ttl = t(title, lang);
  if (!ttl && !eyebrow) return null;
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow ? <span className="text-xs font-bold uppercase tracking-[0.3em] text-t-accent">{eyebrow}</span> : null}
      {ttl ? <h2 className={cn("font-heading mt-3 text-3xl font-semibold tracking-wide sm:text-4xl", light ? "text-t-dark-fg" : "text-t-fg")}>{ttl}</h2> : null}
      <GoldRule className="mt-5" />
    </div>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const bannerHref = section(ctx, bannerSection)?.cta?.href || "/contact";
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={null}
          className="[&>div>a>span]:uppercase [&>div>a>span]:tracking-[0.18em] [&>div>a>span]:text-t-accent"
          rightSlot={
            <>
              <SmartLink href={bannerHref} ctx={ctx} className="t-btn t-btn-outline hidden px-4 py-2 text-sm text-t-accent md:inline-flex">
                {t(CORPORATE, ctx.lang)}
              </SmartLink>
              <CartButton ctx={lc} mode="drawer" className="hover:bg-t-dark-fg/10" />
            </>
          }
        />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-t-accent to-transparent" aria-hidden="true" />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" className="border-t-2 border-t-accent" />
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
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
        <div className="text-center lg:text-start">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-t-accent">
              <span className="h-px w-8 bg-t-accent" aria-hidden="true" />
              {h.eyebrow}
              <span className="h-px w-8 bg-t-accent" aria-hidden="true" />
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-semibold leading-[1.15] tracking-wide text-t-accent sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-t-dark-fg/75 lg:mx-0">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-accent" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 lg:justify-start">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-t-dark-fg/80">
                  <span className="text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 border border-t-accent/50" aria-hidden="true" />
          <div className="absolute -inset-2 border border-t-accent" aria-hidden="true" />
          {["-start-5 -top-5", "-end-5 -top-5", "-start-5 -bottom-5", "-end-5 -bottom-5"].map((pos) => (
            <span key={pos} className={cn("absolute size-2.5 rotate-45 bg-t-accent", pos)} aria-hidden="true" />
          ))}
          <Img src={h.image} alt="" className="relative aspect-square w-full object-cover" fallback={<Gift className="size-20 text-t-accent/50" />} />
        </div>
      </Container>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-t-accent to-transparent" aria-hidden="true" />
    </section>
  );
}

/* ---------- Collections ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-24">
      <Container>
        <FormalHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className={cn("grid gap-6 sm:grid-cols-2", d.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className="group block text-center">
                  <div className="border border-t-accent/60 p-2 transition group-hover:border-t-accent">
                    <Img src={it.image} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]" fallback={<Package className="size-12 text-t-accent/60" />} />
                  </div>
                  <h3 className="font-heading mt-4 text-lg font-semibold uppercase tracking-wide text-t-fg group-hover:text-t-primary">{t(it.title, lang)}</h3>
                  {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
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
    <section id="products" className="border-y border-t-border bg-t-muted py-16 sm:py-24">
      <Container>
        <FormalHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:border-t-2 [&_article]:[border-top-color:var(--t-accent)]" />
        <div className="mt-12 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Corporate & bulk gifting banner ---------- */
function CorporateBanner({ ctx }: TemplatePageProps) {
  const d = section(ctx, bannerSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-24">
      <Container>
        <div className="border border-t-accent p-2">
          <div className={cn("grid items-center gap-8 border border-t-accent/40 bg-t-dark text-t-dark-fg lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
            <div className="p-8 text-center sm:p-12 lg:text-start">
              {d.eyebrow ? <span className="text-xs font-bold uppercase tracking-[0.3em] text-t-accent">{d.eyebrow}</span> : null}
              <h2 className="font-heading mt-3 text-3xl font-semibold tracking-wide sm:text-4xl">{title}</h2>
              <GoldRule className="mt-5 justify-center lg:justify-start" />
              <p className="mt-5 max-w-lg text-t-dark-fg/75">{t(d.text, lang)}</p>
              <div className="mt-8">
                <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              </div>
            </div>
            <div className="p-2 lg:p-4">
              <Img src={d.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Package className="size-16 text-t-accent/50" />} />
            </div>
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
        promo: () => <PromoStrip ctx={ctx} className="[&_p]:font-heading [&_p]:tracking-wide" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <CorporateBanner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_.t-eyebrow]:text-t-accent [&_.t-eyebrow]:tracking-[0.3em] [&_h3]:tracking-wide" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="border-y border-t-border bg-t-muted [&_.t-eyebrow]:text-t-accent [&_.t-eyebrow]:tracking-[0.3em]" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="[&_.t-eyebrow]:text-t-accent [&_.t-eyebrow]:tracking-[0.3em]" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="border-y-2 border-t-accent" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted [&_.t-eyebrow]:text-t-accent [&_.t-eyebrow]:tracking-[0.3em]" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="[&_.t-eyebrow]:text-t-accent [&_.t-eyebrow]:tracking-[0.3em]" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="border-t-2 border-t-accent" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
