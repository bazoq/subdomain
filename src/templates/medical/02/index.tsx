/**
 * medical-02 "Sehat Store" (#1502) — Friendly green wellness pharmacy.
 * Brief: green rounded header with pill nav, a WhatsApp order button and prescription upload; soft hero with a big
 * rounded photo and friendly headline; wellness categories as pastel rounded tiles; prescription block as a card
 * with icon steps; rounded pastel green bands, amber highlights.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileHeart, HeartHandshake, Leaf, Pill, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { SiteContext, TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { bannerSection, collectionsSection, featuredProductsSection, prescriptionCtaSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, FeaturesBlock, PromoStrip, SiteFooter, SiteHeader, StatsBlock, TestimonialsBlock } from "@/modules/shared/ui";
import { CartButton, CartDrawer, EcommerceProviders, ProductGrid, sui, type ProductDTO } from "@/modules/ecommerce/ui";
import { getFeaturedProducts, getProducts } from "@/modules/ecommerce/queries";

/** Remap the dark surface to the primary green so the header renders green (tokens only). */
const GREEN_BAND = { "--t-dark": "var(--t-primary)", "--t-dark-fg": "var(--t-primary-fg)" } as React.CSSProperties;
const PASTELS = ["bg-t-muted", "bg-t-accent/25", "bg-t-primary/10", "bg-t-card"];
const STEP_ICONS = [FileHeart, ShieldCheck, Truck, HeartHandshake];

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
        <div className="contents" style={GREEN_BAND}>
          <SiteHeader
            ctx={ctx}
            variant="dark"
            cta={null}
            className="[&_nav_a]:rounded-full [&_nav_a]:font-semibold [&_nav_a:hover]:bg-t-dark-fg/20"
            rightSlot={
              <>
                <SmartLink href="whatsapp" ctx={ctx} className="t-btn t-btn-accent hidden rounded-full px-4 py-2 text-sm font-bold lg:inline-flex">
                  {t(sui.orderOnWhatsApp, ctx.lang)}
                </SmartLink>
                <Link href="/upload-prescription" className="t-btn hidden rounded-full border border-t-dark-fg/40 bg-t-dark-fg/10 px-3 py-2 text-sm font-semibold text-t-dark-fg hover:bg-t-dark-fg/20 md:inline-flex">
                  <FileHeart className="size-4" /> {t(ui.uploadPrescription, ctx.lang)}
                </Link>
                <CartButton ctx={lc} mode="drawer" className="hover:bg-t-dark-fg/20" />
              </>
            }
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

/* ---------- Hero ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-card px-4 py-1.5 text-sm font-bold text-t-primary shadow-sm">
              <Leaf className="size-4" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-t-secondary sm:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full font-bold text-t-primary" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2.5">
              {h.badges.map((b, i) => (
                <li key={i} className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold text-t-secondary", PASTELS[(i + 1) % PASTELS.length])}>
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-4 rotate-2 rounded-[2.5rem] bg-t-accent/30" aria-hidden="true" />
          <Img src={h.image} alt="" priority className="relative aspect-[4/3] w-full rounded-[2rem] bg-t-card object-cover" fallback={<Pill className="size-20 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: pastel wellness tiles ---------- */
function WellnessTiles({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink
                  href={it.href || "/shop"}
                  ctx={ctx}
                  className={cn("group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-t-border transition hover:-translate-y-1 hover:shadow-lg", PASTELS[i % PASTELS.length])}
                >
                  {it.image ? (
                    <Img src={it.image} alt="" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center">
                      <span className="flex size-20 items-center justify-center rounded-full bg-t-card text-t-primary shadow-sm transition group-hover:scale-110">
                        <Sparkles className="size-8" aria-hidden="true" />
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-base font-extrabold text-t-secondary sm:text-lg">{t(it.title, lang)}</h3>
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
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} className="[&_article]:rounded-[1.5rem]" />
        <div className="mt-10 text-center">
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Prescription CTA: soft card with icon steps ---------- */
function PrescriptionCard({ ctx }: TemplatePageProps) {
  const d = section(ctx, prescriptionCtaSection);
  if (!d) return null;
  const lang = ctx.lang;
  const points = d.points ?? [];
  return (
    <section id="prescription" className="py-16 sm:py-20">
      <Container>
        <div className="rounded-[2rem] border border-t-border bg-t-card p-8 shadow-sm sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="flex size-14 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                <FileHeart className="size-7" aria-hidden="true" />
              </span>
              <h2 className="font-heading mt-5 text-3xl font-extrabold tracking-tight text-t-secondary sm:text-4xl">{t(d.title, lang)}</h2>
              <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
              <div className="mt-7">
                <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              </div>
            </div>
            {points.length ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {points.map((p, i) => {
                  const I = STEP_ICONS[i % STEP_ICONS.length];
                  return (
                    <li key={i} className={cn("flex flex-col gap-3 rounded-[1.5rem] p-5", PASTELS[i % PASTELS.length])}>
                      <span className="flex size-11 items-center justify-center rounded-full bg-t-card text-t-primary shadow-sm">
                        <I className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-bold leading-snug text-t-secondary">{t(p.text, lang)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
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
        <div className={cn("grid items-center gap-8 overflow-hidden rounded-[2rem] bg-t-secondary p-8 text-t-secondary-fg sm:p-12 lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div>
            {t(d.eyebrow, lang) ? <span className="inline-block rounded-full bg-t-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-accent-fg">{t(d.eyebrow, lang)}</span> : null}
            <h2 className="font-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg opacity-85">{t(d.text, lang)}</p>
            <div className="mt-7">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full font-bold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" fallback={<Leaf className="size-16 opacity-40" />} />
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
        collections: () => <WellnessTiles ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        prescriptionCta: () => <PrescriptionCard ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="bg-t-muted [&_li]:rounded-[1.5rem] [&_li>span:first-child]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_img]:rounded-[2rem]" />,
        stats: () => (
          <div className="contents" style={GREEN_BAND}>
            <StatsBlock ctx={ctx} variant="cards" light className="[&_.t-card]:rounded-[1.5rem] [&_.t-card]:border-t-dark-fg/20" />
          </div>
        ),
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted [&_figure]:rounded-[1.5rem]" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-muted [&>div>div]:rounded-[2rem]" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
