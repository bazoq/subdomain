/**
 * bakery-04 "Mithai & More" (#1204)
 * Festive desi sweets bakery: maroon and gold, Marcellus serif, ornamental diamond dividers
 * between every section, gold-framed imagery and the custom-cake block framed as bulk gifting.
 */
import * as React from "react";
import { ArrowRight, Building2, Cookie, Gift, MapPin, Moon, PartyPopper, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { customCakeSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { getDeliveryZones } from "@/modules/restaurant/queries";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { FeaturedItems } from "@/modules/restaurant/ui/featured-items";

/* ---------- signature: ornamental gold divider ---------- */
function Ornament({ className, light }: { className?: string; light?: boolean }) {
  const line = light ? "bg-t-accent/40" : "bg-t-accent/60";
  return (
    <div className={cn("mx-auto flex max-w-sm items-center justify-center gap-2", className)} aria-hidden="true">
      <span className={cn("h-px flex-1", line)} />
      <span className="size-1.5 rotate-45 bg-t-accent" />
      <span className="size-2.5 rotate-45 border border-t-accent" />
      <span className="size-1.5 rotate-45 bg-t-accent" />
      <span className={cn("h-px flex-1", line)} />
    </div>
  );
}

/** Gold double frame around imagery. */
function GoldFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative p-2", className)}>
      <span className="absolute inset-0 border border-t-accent" aria-hidden="true" />
      <span className="absolute inset-2 border border-t-accent/40" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}

const GIFTING = [
  { icon: Moon, en: "Eid boxes", ur: "عید باکس" },
  { icon: PartyPopper, en: "Weddings", ur: "شادی" },
  { icon: Building2, en: "Corporate gifting", ur: "کارپوریٹ تحفے" },
  { icon: Gift, en: "Gift hampers", ur: "گفٹ ہیمپر" },
];

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={{ label: { en: "Order cake", ur: "کیک آرڈر کریں" }, href: "/custom-cake" }}
          rightSlot={<CartCountLink host={ctx.host} className="rounded-[var(--t-radius)] border border-t-accent/60 px-3 py-2 text-sm font-semibold text-t-accent" />}
          className="[&_a>span.font-heading]:font-normal [&_a>span.font-heading]:tracking-wide [&_a>span.font-heading]:text-t-accent [&_nav_a]:tracking-wide"
        />
        <div className="h-px w-full bg-t-accent" aria-hidden="true" />
        <main id="main" className="flex-1">{children}</main>
        <div className="h-px w-full bg-t-accent" aria-hidden="true" />
        <SiteFooter ctx={ctx} variant="dark" className="[&_h3]:text-t-accent" />
        <CartBar ctx={rc} className="pb-20 sm:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: centred serif headline between ornaments ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="relative py-16 text-center sm:py-20">
        <div className="t-fade-up mx-auto max-w-3xl">
          <Ornament className="mb-6" />
          {t(h.eyebrow, lang) ? <span className="text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">{t(h.eyebrow, lang)}</span> : null}
          <h1 className="font-heading mt-5 text-4xl font-normal leading-[1.15] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <Ornament className="mt-7" />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border border-t-accent bg-transparent px-6 text-t-fg hover:bg-t-accent hover:text-t-accent-fg" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-8 flex flex-wrap justify-center gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-[var(--t-radius)] border border-t-accent/60 bg-t-card px-3 py-1.5 text-sm font-medium">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <GoldFrame className="mx-auto mt-12 max-w-4xl">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[16/9] w-full object-cover" fallback={<Cookie className="size-14 text-t-primary/40" />} />
        </GoldFrame>
      </Container>
    </section>
  );
}

/* ---------- Custom cake reframed: bulk & gift orders ---------- */
function BulkOrders({ ctx }: TemplatePageProps) {
  const d = section(ctx, customCakeSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="custom-cake" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-t-accent">{t(rs.customCake, lang)}</span>
          <h2 className="font-heading mt-4 text-3xl font-normal leading-tight sm:text-4xl">{t(d.title, lang)}</h2>
          <Ornament className="mx-0 mt-6 max-w-xs" light />
          <p className="mt-6 max-w-xl text-t-dark-fg/75">{t(d.text, lang)}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {GIFTING.map((g) => (
              <li key={g.en} className="flex items-center gap-3 border border-t-accent/30 px-4 py-3 text-sm font-medium">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                  <g.icon className="size-4" />
                </span>
                {lang === "ur" ? g.ur : g.en}
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
        <GoldFrame>
          <Img src={d.image} alt="" className="aspect-[4/5] w-full object-cover" fallback={<Gift className="size-12 text-t-accent/50" />} />
        </GoldFrame>
      </Container>
    </section>
  );
}

/* ---------- Featured menu (module kit) inside a gold frame ---------- */
function FeaturedMenu({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredMenuSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="menu" className="bg-t-bg py-16 sm:py-20">
      <Container>
        {t(d.eyebrow, lang) ? <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">{t(d.eyebrow, lang)}</p> : null}
        <Ornament className="mt-5" />
        <div className="mt-6 border border-t-accent/50 p-4 sm:p-8">
          <FeaturedItems ctx={ctx} take={d.count || 6} title={t(d.title, lang)} layout="list" className="[&_h2]:font-normal" />
          <div className="mt-8 text-center">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn border border-t-primary bg-transparent px-6 text-t-primary hover:bg-t-primary hover:text-t-primary-fg" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: gold-bordered cards ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  return (
    <section id="delivery" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-t-primary">{t(rs.deliveringTo, lang)}</span>
          <h2 className="font-heading mt-3 text-3xl font-normal sm:text-4xl">{t(d.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
          <Ornament className="mt-7" />
        </div>
        {zones.length ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <li key={z.id} className="border border-t-accent/50 bg-t-card p-5 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
                  <MapPin className="size-5" />
                </span>
                <h3 className="font-heading mt-3 text-lg">{z.name}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">
                  {t(ui.deliveryFee, lang)}: <strong className="font-semibold text-t-fg">{z.fee ? formatPKR(z.fee) : t({ en: "Free", ur: "مفت" }, lang)}</strong>
                </p>
                {z.etaMins ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-t-muted-fg">
                    <Timer className="size-3.5" /> {z.etaMins} {t(rs.mins, lang)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-auto mt-8 max-w-xl border border-dashed border-t-accent/60 p-6 text-center text-sm text-t-muted-fg">{ctx.settings.contact.address || ctx.settings.contact.city}</p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours in a gold frame ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <GoldFrame className="mx-auto max-w-xl">
          <div className="bg-t-card p-6 sm:p-9">
            <HoursTable ctx={ctx} title={t(d.title, ctx.lang)} className="[&_h3]:font-normal [&_h3]:text-xl" />
          </div>
        </GoldFrame>
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
        customCake: () => <BulkOrders ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => (
          <div className="bg-t-muted">
            <Ornament className="pt-14" />
            <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted [&_h2]:font-normal [&_ol_span:first-child]:bg-t-accent [&_ol_span:first-child]:text-t-accent-fg" />
          </div>
        ),
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_img]:border [&_img]:border-t-accent [&_img]:p-2" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted [&_button]:border [&_button]:border-t-accent [&_button]:p-1" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-dark text-t-dark-fg" light />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="bg-t-bg" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
      <section className="bg-t-muted py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <Gift className="size-4 text-t-primary" /> {t(rs.customCake, ctx.lang)}
          </span>
          <SmartLink href="/custom-cake" ctx={ctx} className="font-semibold text-t-primary hover:underline">
            {t(ui.orderNow, ctx.lang)} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
