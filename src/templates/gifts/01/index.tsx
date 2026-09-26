/**
 * gifts-01 "Wrapped" (#501) — Cheerful gift boxes and flowers.
 * Brief: white header with rounded nav pills + red "Same-day delivery" chip; confetti-dot hero (CSS radial
 * gradients) with gift box image right and occasion quick links under the headline; occasions grid as pastel
 * tiles with icons plus an "Add a gift message" callout; playful pastels, extra-rounded cards, ribbon dividers.
 */
import * as React from "react";
import { ArrowRight, Baby, Cake, Flower2, Gift, Heart, MessageSquareHeart, MoonStar, PartyPopper, Sparkles, Star, Truck } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, GalleryBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

const SAME_DAY = ls("Same-day delivery", "اسی دن ڈیلیوری");
const GIFT_MESSAGE = ls("Add a gift message", "تحفے کا پیغام شامل کریں");

/* confetti dots built only from theme tokens */
const CONFETTI: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--t-primary) 45%, transparent) 0 5px, transparent 6px)",
    "radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--t-accent) 95%, transparent) 0 6px, transparent 7px)",
    "radial-gradient(circle at 40% 85%, color-mix(in srgb, var(--t-primary) 35%, transparent) 0 4px, transparent 5px)",
    "radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--t-accent) 85%, transparent) 0 5px, transparent 6px)",
    "radial-gradient(circle at 60% 40%, color-mix(in srgb, var(--t-secondary) 18%, transparent) 0 3px, transparent 4px)",
  ].join(","),
  backgroundSize: "220px 220px, 260px 260px, 180px 180px, 300px 300px, 140px 140px",
};

const PASTELS = ["bg-t-muted", "bg-t-accent/40", "bg-t-primary/10", "bg-t-secondary/10"];
const ICONS = [Cake, MoonStar, Heart, Flower2, PartyPopper, Gift, Star, Sparkles];

function occasionIcon(title: string, i: number) {
  const s = title.toLowerCase();
  if (/birth/.test(s)) return Cake;
  if (/eid|ramad|moon/.test(s)) return MoonStar;
  if (/wedd|nikk|valima|annivers|love|valentine/.test(s)) return Heart;
  if (/flower|bouq|mother/.test(s)) return Flower2;
  if (/party|celebr|new year|congrat|gradu/.test(s)) return PartyPopper;
  if (/baby|kid|child/.test(s)) return Baby;
  return ICONS[i % ICONS.length];
}

async function loadProducts(ctx: SiteContext, mode: string, count: number): Promise<ProductDTO[]> {
  const take = Math.min(16, Math.max(4, Math.floor(Number(count) || 8)));
  if (mode === "newest") return (await getProducts(ctx.tenant.id, { sort: "newest", take })).items;
  const featured = await getFeaturedProducts(ctx.tenant.id, take);
  return featured.length ? featured : (await getProducts(ctx.tenant.id, { sort: "featured", take })).items;
}

/* ribbon-like divider (eyebrow text) */
function Ribbon({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="flex justify-center">
      <span className="inline-block bg-t-primary px-8 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg [clip-path:polygon(0_0,100%_0,calc(100%-12px)_50%,100%_100%,0_100%,12px_50%)]">{text}</span>
    </div>
  );
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
          variant="light"
          className="[&_nav_a]:rounded-full"
          rightSlot={
            <>
              <span className="hidden items-center gap-1.5 rounded-full bg-t-primary px-3 py-1 text-xs font-bold text-t-primary-fg sm:inline-flex">
                <Truck className="size-3.5" /> {t(SAME_DAY, ctx.lang)}
              </span>
              <CartButton ctx={lc} mode="drawer" />
            </>
          }
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="light" />
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
  const occasions = section(ctx, collectionsSection)?.items ?? [];
  return (
    <section className="relative overflow-hidden bg-t-bg">
      <div className="pointer-events-none absolute inset-0" style={CONFETTI} aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-t-accent-fg">
              <PartyPopper className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary" />
          </div>
          {occasions.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {occasions.slice(0, 6).map((o, i) => {
                const I = occasionIcon(t(o.title, "en"), i);
                return (
                  <li key={i}>
                    <SmartLink href={o.href || "/shop"} ctx={ctx} className="inline-flex items-center gap-1.5 rounded-full border border-t-border bg-t-card px-3.5 py-1.5 text-sm font-semibold text-t-fg transition hover:border-t-primary hover:text-t-primary">
                      <I className="size-4 text-t-primary" /> {t(o.title, lang)}
                    </SmartLink>
                  </li>
                );
              })}
            </ul>
          ) : h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap gap-4">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold text-t-fg">
                  <span className="flex size-8 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-t-accent/60" aria-hidden="true" />
          <div className="absolute -inset-3 -rotate-2 rounded-[2rem] bg-t-primary/10" aria-hidden="true" />
          <Img src={h.image} alt="" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl" fallback={<Gift className="size-20 text-t-primary/40" />} />
          <span className="absolute -bottom-4 start-6 inline-flex items-center gap-2 rounded-full bg-t-card px-4 py-2 text-sm font-bold text-t-fg shadow-lg">
            <Truck className="size-4 text-t-primary" /> {t(SAME_DAY, lang)}
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Occasions (collections) + gift-message callout ---------- */
function Occasions({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <Ribbon text={d.eyebrow} />
        <SectionHeading title={d.title} lang={lang} className="mt-4" />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const I = occasionIcon(t(it.title, "en"), i);
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink href={it.href || "/shop"} ctx={ctx} className={cn("group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-t-border transition hover:-translate-y-1 hover:shadow-lg", PASTELS[i % PASTELS.length])}>
                  {it.image ? (
                    <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center">
                      <span className="flex size-20 items-center justify-center rounded-full bg-t-card text-t-primary shadow-sm transition group-hover:scale-110">
                        <I className="size-9" />
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-bold text-t-fg">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-1 text-sm text-t-muted-fg">{sub}</p> : null}
                  </div>
                </SmartLink>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-t-primary/40 bg-t-card p-6 text-center sm:flex-row sm:text-start">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
            <MessageSquareHeart className="size-7" />
          </span>
          <div className="flex-1">
            <p className="font-heading text-lg font-bold">{t(GIFT_MESSAGE, lang)}</p>
            <p className="text-sm text-t-muted-fg">{t(sui.giftMessageHelp, lang)}</p>
          </div>
          <SmartLink href="/shop" ctx={ctx} className="t-btn t-btn-primary rounded-full">
            {t(ui.shop, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
          </SmartLink>
        </div>
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
        <Ribbon text={d.eyebrow} />
        <SectionHeading title={d.title} lang={ctx.lang} className="mt-4" />
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:rounded-[1.5rem]" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
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
        <div className={cn("grid items-center overflow-hidden rounded-[2rem] bg-t-secondary text-t-secondary-fg lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {d.eyebrow ? <span className="t-eyebrow text-t-accent">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg opacity-85">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full" />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto" fallback={<Gift className="size-16 opacity-30" />} />
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
        collections: () => <Occasions ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="[&_li]:rounded-[1.5rem]" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={4} />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" className="bg-t-bg [&_.t-card]:rounded-[1.5rem]" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="[&>div>div]:rounded-[2rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
