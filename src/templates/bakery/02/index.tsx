/**
 * bakery-02 "Daily Crust" (#1202)
 * Rustic artisan bread bakery: kraft-paper surfaces with a hatched texture, Lora serif type,
 * a chalkboard featured-menu list with dotted price leaders and a prominent hours card.
 */
import * as React from "react";
import { ArrowRight, Croissant, MapPin, Timer, Wheat } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { customCakeSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { getDeliveryZones, getFeaturedItems } from "@/modules/restaurant/queries";
import { itemStartingPrice, toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { OpenBadge } from "@/modules/restaurant/ui/open-badge";
import { TagBadges } from "@/modules/restaurant/ui/tag-badges";

/* ---------- signature: kraft paper hatch + wheat rule ---------- */
function Kraft({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 opacity-40", className)}
      style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--t-border) 0 1px, transparent 1px 9px)" }}
    />
  );
}

function WheatRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-t-primary", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-t-border" />
      <Wheat className="size-5" />
      <span className="h-px flex-1 bg-t-border" />
    </div>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <div className="h-1.5 w-full bg-t-muted" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--t-primary) 0 8px, transparent 8px 20px)" }} aria-hidden="true" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: { en: "Order for pickup", ur: "پک اپ آرڈر کریں" }, href: "/menu" }}
          rightSlot={<CartCountLink host={ctx.host} className="rounded-none border border-t-border bg-t-card px-3 py-2 text-sm font-semibold text-t-primary" />}
          className="border-b-2 border-t-border bg-t-muted/95 [&_a>span.font-heading]:tracking-tight [&_nav_a]:rounded-none"
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartBar ctx={rc} className="pb-20 sm:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: bread photo in a kraft frame + open-now chip ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden border-b-2 border-t-border bg-t-muted">
      <Kraft />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div className="relative order-2 lg:order-1">
          <div className="absolute inset-0 translate-x-3 translate-y-3 border-2 border-t-primary/40 rtl:-translate-x-3" aria-hidden="true" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-[4/3] w-full border-2 border-t-border object-cover" fallback={<Croissant className="size-14 text-t-primary/40" />} />
          {h.badges?.length ? (
            <ul className="relative -mt-6 ms-4 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 border border-t-border bg-t-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="t-fade-up order-1 lg:order-2">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-t-primary">
              <Wheat className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-bold leading-[1.15] text-t-fg sm:text-5xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <OpenBadge ctx={ctx} className="mt-6" />
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline text-t-fg" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Custom cake: kraft order slip ---------- */
function CustomCake({ ctx }: TemplatePageProps) {
  const d = section(ctx, customCakeSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="custom-cake" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <div className="relative grid items-stretch gap-0 border-2 border-t-border bg-t-card lg:grid-cols-[1fr_0.9fr]">
          <Kraft className="opacity-25" />
          <div className="relative p-6 sm:p-10">
            <span className="t-eyebrow">{t(rs.customCake, lang)}</span>
            <h2 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">{t(d.title, lang)}</h2>
            <WheatRule className="mt-5 max-w-xs" />
            <p className="mt-5 text-t-muted-fg">{t(d.text, lang)}</p>
            <div className="mt-8">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
          <div className="relative min-h-56">
            <Img src={d.image} alt="" className="h-full w-full object-cover" fallback={<Croissant className="size-12 text-t-primary/40" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: chalkboard featured menu with dotted leaders ---------- */
async function Chalkboard({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredMenuSection);
  if (!d) return null;
  const items = await getFeaturedItems(ctx.tenant.id, d.count || 6);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="menu" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container>
        <div className="border-2 border-t-dark-fg/25 p-3 sm:p-5">
          <div className="border border-t-dark-fg/15 px-5 py-8 sm:px-10 sm:py-12">
            <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} light className="mb-10" />
            <ul className="grid gap-x-14 gap-y-6 lg:grid-cols-2">
              {items.map((item) => {
                const desc = t(item.description, lang);
                return (
                  <li key={item.id}>
                    <a href={`/menu#item-${item.slug}`} className="group flex items-baseline gap-2">
                      <span className="font-heading text-lg font-bold transition group-hover:text-t-accent">{t(item.name, lang)}</span>
                      <span className="flex-1 self-end border-b border-dashed border-t-dark-fg/35 pb-1.5" aria-hidden="true" />
                      <span className="font-heading whitespace-nowrap text-lg font-bold text-t-accent">
                        {item.sizes.length > 1 ? <span className="me-1 text-xs font-normal text-t-dark-fg/60">{t(rs.from, lang)}</span> : null}
                        {formatPKR(itemStartingPrice(item))}
                      </span>
                    </a>
                    {desc ? <p className="mt-1 max-w-md text-sm text-t-dark-fg/60">{desc}</p> : null}
                    <TagBadges tags={item.tags} lang={lang} className="mt-2" />
                  </li>
                );
              })}
            </ul>
            <div className="mt-12 text-center">
              <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-accent" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: kraft receipt rows ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  return (
    <section id="delivery" className="relative overflow-hidden border-y-2 border-t-border bg-t-muted py-16 sm:py-20">
      <Kraft />
      <Container className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="t-eyebrow">{t(rs.deliveringTo, lang)}</span>
          <h2 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">{t(d.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
        </div>
        {zones.length ? (
          <ul className="divide-y divide-dashed divide-t-border border-2 border-t-border bg-t-card">
            {zones.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4">
                <span className="flex items-center gap-2 font-heading text-base font-bold">
                  <MapPin className="size-4 text-t-primary" /> {z.name}
                </span>
                <span className="ms-auto text-sm text-t-muted-fg">
                  {t(ui.deliveryFee, lang)}: <strong className="font-semibold text-t-fg">{z.fee ? formatPKR(z.fee) : t({ en: "Free", ur: "مفت" }, lang)}</strong>
                </span>
                {z.minOrder ? (
                  <span className="text-sm text-t-muted-fg">
                    {t(rs.minOrder, lang)}: <strong className="font-semibold text-t-fg">{formatPKR(z.minOrder)}</strong>
                  </span>
                ) : null}
                {z.etaMins ? (
                  <span className="inline-flex items-center gap-1 text-sm text-t-muted-fg">
                    <Timer className="size-3.5" /> {z.etaMins} {t(rs.mins, lang)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 border-2 border-dashed border-t-border p-8 text-sm text-t-muted-fg">
            <MapPin className="size-5 shrink-0 opacity-60" /> {ctx.settings.contact.address || ctx.settings.contact.city}
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: the bakery's headline block ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  const lang = ctx.lang;
  return (
    <section id="hours" className="bg-t-bg py-16 sm:py-20">
      <Container>
        <WheatRule className="mx-auto mb-10 max-w-md" />
        <div className="mx-auto max-w-2xl border-2 border-t-border bg-t-card p-6 shadow-sm sm:p-10">
          <HoursTable ctx={ctx} title={t(d.title, lang)} className="[&_h3]:text-xl" />
          <OpenBadge ctx={ctx} className="mt-6 justify-center" showHours={false} />
          {ctx.settings.contact.address ? (
            <p className="mt-6 flex items-start justify-center gap-2 text-center text-sm text-t-muted-fg">
              <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" /> {ctx.settings.contact.address}
            </p>
          ) : null}
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
        customCake: () => <CustomCake ctx={ctx} />,
        featuredMenu: () => <Chalkboard ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="border-y-2 border-t-border bg-t-muted" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_img]:rounded-none [&_img]:border-2 [&_img]:border-t-border" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" className="border-y-2 border-t-border bg-t-muted" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} className="border-y-2 border-t-border bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="bg-t-muted" />,
      })}
      <section className="border-t-2 border-t-border bg-t-bg py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          {ctx.settings.contact.phone || ctx.settings.contact.whatsapp ? (
            <a href={`tel:${ctx.settings.contact.phone || ctx.settings.contact.whatsapp}`} className="inline-flex items-center gap-2 hover:text-t-primary">
              <Wheat className="size-4 text-t-primary" /> {t(rs.callUs, ctx.lang)}: <span dir="ltr">{ctx.settings.contact.phone || ctx.settings.contact.whatsapp}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Wheat className="size-4 text-t-primary" /> {ctx.tenant.name}
            </span>
          )}
          <SmartLink href="/menu" ctx={ctx} className="font-semibold text-t-primary hover:underline">
            {t(rs.seeFullMenu, ctx.lang)} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
