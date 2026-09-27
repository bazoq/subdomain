/**
 * medical-01 "CarePlus Pharmacy" (#1501) — Clinical blue and white, trust-first.
 * Brief: cross-marked info strip over a white header with a product search, a green "Upload prescription" button and
 * cart; hero with two CTAs, pharmacist photo and licence trust badges; prescription block as three numbered steps;
 * categories as icon chips; clean high-legibility blue and green.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Baby, BriefcaseMedical, CheckCircle2, Cross, HeartPulse, Phone, Pill, Search, Stethoscope, Syringe, Thermometer } from "lucide-react";
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

const CHIP_ICONS = [Pill, Baby, HeartPulse, Stethoscope, Syringe, Thermometer, BriefcaseMedical];

function chipIcon(title: string, i: number) {
  const s = title.toLowerCase();
  if (/baby|child|kid|mother/.test(s)) return Baby;
  if (/vitamin|wellness|supplement|nutri/.test(s)) return HeartPulse;
  if (/device|monitor|bp|sugar|thermo/.test(s)) return Stethoscope;
  if (/inject|syringe|vaccine/.test(s)) return Syringe;
  if (/medicine|tablet|capsule|pharma/.test(s)) return Pill;
  return CHIP_ICONS[i % CHIP_ICONS.length];
}

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
        <div className="bg-t-primary text-t-primary-fg">
          <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs">
            <span className="flex items-center gap-2 font-semibold">
              <Cross className="size-4 fill-current" aria-hidden="true" /> {ctx.tenant.name}
            </span>
            {phone ? (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 font-semibold hover:underline">
                <Phone className="size-3.5" aria-hidden="true" /> <span dir="ltr">{phone}</span>
              </a>
            ) : null}
          </Container>
        </div>
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={null}
          className="[&_nav_a]:font-medium"
          rightSlot={
            <>
              <form action="/shop" method="get" role="search" className="relative hidden w-56 lg:block">
                <label className="sr-only" htmlFor="careplus-q">
                  {t(ui.search, ctx.lang)}
                </label>
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-t-muted-fg" aria-hidden="true" />
                <input id="careplus-q" type="search" name="q" placeholder={t(sui.searchPlaceholder, ctx.lang)} className="t-input h-10 w-full ps-9" maxLength={80} />
              </form>
              <Link href="/upload-prescription" className="t-btn t-btn-accent hidden px-3 py-2 text-sm font-semibold md:inline-flex">
                <Cross className="size-4" /> {t(ui.uploadPrescription, ctx.lang)}
              </Link>
              <CartButton ctx={lc} mode="drawer" />
            </>
          }
        />
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
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-card px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-t-primary shadow-sm">
              <BriefcaseMedical className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-t-secondary sm:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-accent font-semibold" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 grid gap-2.5 sm:grid-cols-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-t-secondary">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-t-accent/15 text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-3 rounded-[1.5rem] bg-t-primary/10" aria-hidden="true" />
          <Img src={h.image} alt="" className="relative aspect-[4/5] w-full rounded-[1.25rem] bg-t-card object-cover" fallback={<Stethoscope className="size-20 text-t-primary/30" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collections: icon chips ---------- */
function IconChips({ ctx }: TemplatePageProps) {
  const d = section(ctx, collectionsSection);
  if (!d || !d.items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="collections" className="py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {d.items.map((it, i) => {
            const I = chipIcon(t(it.title, "en"), i);
            const sub = t(it.subtitle, lang);
            return (
              <li key={i}>
                <SmartLink
                  href={it.href || "/shop"}
                  ctx={ctx}
                  className="group flex h-full items-center gap-3 rounded-[var(--t-radius)] border border-t-border bg-t-card p-4 transition hover:border-t-primary hover:shadow-sm"
                >
                  {it.image ? (
                    <Img src={it.image} alt="" className="size-14 shrink-0 rounded-full bg-t-muted object-cover" />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-t-muted text-t-primary transition group-hover:bg-t-primary group-hover:text-t-primary-fg">
                      <I className="size-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <h3 className="font-heading text-sm font-bold group-hover:text-t-primary sm:text-base">{t(it.title, lang)}</h3>
                    {sub ? <p className="mt-0.5 text-xs text-t-muted-fg sm:text-sm">{sub}</p> : null}
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
    <section id="products" className="border-y border-t-border bg-t-muted py-14 sm:py-16">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} align="left" className="mb-0" />
          <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-outline text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ProductGrid products={products} ctx={ctx} showQuickAdd columns={4} />
      </Container>
    </section>
  );
}

/* ---------- Prescription CTA: three numbered steps ---------- */
function PrescriptionSteps({ ctx }: TemplatePageProps) {
  const d = section(ctx, prescriptionCtaSection);
  if (!d) return null;
  const lang = ctx.lang;
  const title = t(d.title, lang);
  const points = d.points ?? [];
  return (
    <section id="prescription" className="py-14 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-[var(--t-radius)] bg-t-primary text-t-primary-fg">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-t-primary-fg/15">
                <Cross className="size-6 fill-current" aria-hidden="true" />
              </span>
              <h2 className="font-heading mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
              <p className="mt-4 max-w-lg opacity-90">{t(d.text, lang)}</p>
              <div className="mt-7">
                <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent font-semibold" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              </div>
            </div>
            {points.length ? (
              <ol className="space-y-4">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-4 rounded-[var(--t-radius)] bg-t-primary-fg/10 p-4">
                    <span className="font-heading flex size-9 shrink-0 items-center justify-center rounded-full bg-t-accent text-sm font-bold text-t-accent-fg">{i + 1}</span>
                    <span className="pt-1.5 text-sm font-medium leading-snug">{t(p.text, lang)}</span>
                  </li>
                ))}
              </ol>
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
    <section id="banner" className="py-14 sm:py-16">
      <Container>
        <div className={cn("grid items-center overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-card lg:grid-cols-2", d.align === "left" && "lg:[&>*:first-child]:order-2")}>
          <div className="p-8 sm:p-12">
            {d.eyebrow ? <span className="t-eyebrow">{d.eyebrow}</span> : null}
            <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight text-t-secondary sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-7 flex items-center gap-3">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <span className="flex items-center gap-1.5 text-sm font-medium text-t-accent">
                <CheckCircle2 className="size-4" aria-hidden="true" /> {t(ui.cashOnDelivery, lang)}
              </span>
            </div>
          </div>
          <Img src={d.image} alt="" className="aspect-[4/3] h-full w-full bg-t-muted object-cover lg:aspect-auto" fallback={<Pill className="size-16 text-t-primary/30" />} />
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
        collections: () => <IconChips ctx={ctx} />,
        featuredProducts: () => <Products ctx={ctx} />,
        prescriptionCta: () => <PrescriptionSteps ctx={ctx} />,
        banner: () => <Banner ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} className="border-y border-t-border bg-t-muted [&_li>span:first-child]:rounded-full" />,
        about: () => <AboutBlock ctx={ctx} variant="split" />,
        stats: () => <StatsBlock ctx={ctx} variant="row" light className="py-14" />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
