/**
 * kitchen-04 "Desi Rasoi" (#104) — Playful, colourful, family-friendly kitchen store.
 * Brief: teal header with a white logo, rounded pill nav and an orange cart pill; illustrated-feel hero with
 * a big rounded image blob and floating badge chips; collections as colourful rounded tiles (teal/mango/cream);
 * testimonials as speech bubbles; extra-rounded cards, alternating pastel section bands, friendly footer.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CookingPot, MessageCircle, Sparkles, Star } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, testimonialsSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, whatsappLink } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, sectionData } from "@/modules/shared/ui";
import type { HeadingData, LinkData } from "@/modules/shared/ui/section-types";
import { getTestimonials } from "@/modules/shared/queries";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";
import type { ProductDTO } from "@/modules/ecommerce/types";

/* ---------- ecommerce pack section shapes ---------- */
type CollectionItem = { title: LocalizedString; subtitle?: LocalizedString; image?: string; href: string };
type CollectionsData = HeadingData & { items?: CollectionItem[] };
type FeaturedData = HeadingData & { mode?: string; count?: number; cta?: LinkData };
type BannerData = HeadingData & { text?: LocalizedString; image?: string; cta?: LinkData; align?: string };

async function loadProducts(ctx: SiteContext, d: FeaturedData): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Number(d.count) || 8));
  if (d.mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/** teal chrome: remap the "dark" surface onto the primary colour so kit blocks render as teal bands */
const TEAL_BAND = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
const BLOB: React.CSSProperties = { borderRadius: "58% 42% 46% 54% / 44% 52% 48% 56%" };
const TILES = ["bg-t-primary text-t-primary-fg", "bg-t-accent text-t-accent-fg", "bg-t-muted text-t-fg", "bg-t-secondary text-t-primary-fg"];

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const lc = { lang: ctx.lang };
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;
  return (
    <EcommerceProviders ctx={ctx}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <div className="contents" style={TEAL_BAND}>
          <SiteHeader
            ctx={ctx}
            variant="dark"
            cta={null}
            className="[&_nav_a]:rounded-full [&_nav_a]:px-4 [&_nav_a]:font-bold"
            rightSlot={<CartButton ctx={lc} mode="drawer" className="rounded-full bg-t-accent px-3 text-t-accent-fg hover:bg-t-accent/90 [&>span]:bg-t-secondary [&>span]:text-t-primary-fg" />}
          />
        </div>
        <main id="main" className="flex-1">{children}</main>
        {wa ? (
          <div className="bg-t-accent text-t-accent-fg">
            <Container className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:flex-row">
              <p className="font-heading text-lg font-bold">{ctx.tenant.name}</p>
              <a href={whatsappLink(wa)} target="_blank" rel="noreferrer" className="t-btn rounded-full bg-t-secondary text-t-primary-fg hover:opacity-90">
                <MessageCircle className="size-4" /> {t(ui.whatsapp, ctx.lang)}
              </a>
            </Container>
          </div>
        ) : null}
        <SiteFooter ctx={ctx} variant="primary" />
        <CartDrawer ctx={lc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </EcommerceProviders>
  );
}

/* ---------- Hero: rounded blob + floating chips ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <span className="pointer-events-none absolute -start-16 -top-16 size-64 rounded-full bg-t-accent/30" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-24 end-1/3 size-72 rounded-full bg-t-primary/10" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-card px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-t-primary shadow-sm">
              <Sparkles className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.1] text-t-secondary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7 text-base font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full bg-t-accent px-7 text-base font-bold text-t-accent-fg hover:opacity-90" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
          <div className="absolute inset-0 -rotate-6 bg-t-accent/50" style={BLOB} aria-hidden="true" />
          <Img src={h.image} alt="" priority className="relative aspect-square w-full object-cover" style={BLOB} fallback={<CookingPot className="size-20 text-t-primary/40" />} />
          {h.badges?.length ? (
            <ul className="absolute inset-0">
              {h.badges.slice(0, 4).map((b, i) => (
                <li
                  key={i}
                  className={cn(
                    "absolute inline-flex items-center gap-1.5 rounded-full bg-t-card px-3 py-2 text-xs font-bold shadow-lg",
                    ["-start-3 top-6", "-end-2 top-1/3", "start-2 bottom-8", "-end-4 bottom-1/4"][i],
                  )}
                >
                  <Icon name={b.icon} className="size-4 text-t-primary" /> {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: colourful rounded tiles ---------- */
function Collections({ ctx }: TemplatePageProps) {
  const d = sectionData<CollectionsData>(ctx, collectionsSection);
  if (!d?.items?.length) return null;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {d.items.map((c, i) => (
            <li key={i}>
              <Link href={c.href || "/shop"} className={cn("group flex h-full flex-col overflow-hidden rounded-[2rem] transition hover:-translate-y-1.5 hover:shadow-xl", TILES[i % TILES.length])}>
                <Img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<CookingPot className="size-10 opacity-40" />} />
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold leading-tight">{t(c.title, ctx.lang)}</h3>
                  {t(c.subtitle, ctx.lang) ? <p className="mt-1 text-sm opacity-80">{t(c.subtitle, ctx.lang)}</p> : null}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline">
                    {t(ui.shop, ctx.lang)} <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured products ---------- */
async function Products({ ctx }: TemplatePageProps) {
  const d = sectionData<FeaturedData>(ctx, featuredProductsSection);
  if (!d) return null;
  const products = await loadProducts(ctx, d);
  if (!products.length) return null;
  return (
    <section id="featured" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ProductGrid products={products} ctx={ctx} columns={4} showQuickAdd className="[&_article]:rounded-[1.75rem] [&_article]:border-0 [&_article]:shadow-sm [&_article_button]:rounded-full" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7 font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Banner: rounded blob split ---------- */
function Banner({ ctx }: TemplatePageProps) {
  const d = sectionData<BannerData>(ctx, bannerSection);
  if (!d) return null;
  const title = t(d.title, ctx.lang);
  if (!title) return null;
  return (
    <section id="banner" className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(d.align === "left" && "lg:order-2")}>
          {d.eyebrow ? <span className="inline-block rounded-full bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-widest text-t-accent-fg">{d.eyebrow}</span> : null}
          <h2 className="font-heading mt-4 text-3xl font-bold leading-tight text-t-secondary sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-lg text-lg text-t-muted-fg">{t(d.text, ctx.lang)}</p>
          <div className="mt-7">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7 font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <div className={cn("relative", d.align === "left" && "lg:order-1")}>
          <div className="absolute inset-0 rotate-6 bg-t-primary/15" style={BLOB} aria-hidden="true" />
          <Img src={d.image} alt="" className="relative aspect-[4/3] w-full rounded-[2.5rem] object-cover" fallback={<CookingPot className="size-14 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Testimonials as speech bubbles ---------- */
const BUBBLES = ["bg-t-card", "bg-t-muted", "bg-t-accent/40"];

async function Bubbles({ ctx }: TemplatePageProps) {
  const rows = await getTestimonials(ctx.tenant.id, 6);
  if (!rows.length) return null;
  const h = sectionData<HeadingData>(ctx, testimonialsSection) ?? {};
  return (
    <section id="testimonials" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} />
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <li key={r.id}>
              <div className={cn("relative rounded-[1.75rem] p-6 shadow-sm", BUBBLES[i % BUBBLES.length])}>
                {r.rating ? (
                  <span className="mb-2 inline-flex text-t-primary" aria-label={`${r.rating} / 5`}>
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={cn("size-4", k < r.rating ? "fill-current" : "opacity-30")} />
                    ))}
                  </span>
                ) : null}
                <p className="text-sm leading-7 text-t-fg">{t(r.text as LocalizedString, ctx.lang)}</p>
                <span className="absolute -bottom-3 start-8 size-6 rotate-45 rounded-br-[6px] bg-inherit" aria-hidden="true" />
              </div>
              <div className="mt-5 flex items-center gap-3 ps-6">
                {r.imageUrl ? <Img src={r.imageUrl} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-t-primary/10 font-bold text-t-primary">{r.name.charAt(0)}</span>}
                <span>
                  <span className="block text-sm font-bold">{r.name}</span>
                  {r.role ? <span className="block text-xs text-t-muted-fg">{r.role}</span> : null}
                </span>
              </div>
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
        promo: () => <PromoStrip ctx={ctx} className="[&_span]:rounded-full" />,
        collections: () => <Collections ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted [&_li]:rounded-[1.75rem] [&_li]:border-0 [&_span]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="[&_img]:rounded-[2rem]" />,
        stats: () => (
          <div className="contents" style={TEAL_BAND}>
            <StatsBlock ctx={ctx} variant="cards" light className="py-16 [&_.t-card]:rounded-[1.75rem] [&_.t-card]:border-t-dark-fg/20" />
          </div>
        ),
        testimonials: () => <Bubbles ctx={ctx} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="[&>div>div]:rounded-[2.5rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
