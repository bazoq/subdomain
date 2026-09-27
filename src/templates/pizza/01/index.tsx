/**
 * pizza-01 "Slice House" (#901)
 * Classic red & cream pizzeria. Cream header with red script logo, "Order now" red pill and an
 * open-now badge beside the phone; big pizza photo hero with a floating deals badge and a red
 * checkered strip; deals as red ticket cards with dashed edges; featured menu grid with "Add"
 * buttons; warm cream sections, rounded cards, dark footer with hours.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, MapPin, Phone, Pizza, Plus } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { OpenBadge } from "@/modules/restaurant/ui";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { TagBadges } from "@/modules/restaurant/ui/tag-badges";
import { itemStartingPrice, toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { getDeliveryZones, getFeaturedItems } from "@/modules/restaurant/queries";

const L = {
  freeDelivery: ls("Free delivery", "مفت ڈیلیوری"),
  callUs: ls("Call to order", "آرڈر کے لیے کال کریں"),
  findUs: ls("Find us", "ہمیں یہاں پائیں"),
};

/* ---------- signature: red checkered strip ---------- */
function Checkered({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("h-4 w-full bg-t-bg [background-image:repeating-conic-gradient(var(--t-primary)_0%_25%,transparent_0%_50%)] [background-size:16px_16px]", className)} />;
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const phone = ctx.settings.contact.phone;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          className="[&_.t-btn]:rounded-full"
          cta={{ label: ui.orderNow, href: "/menu" }}
          rightSlot={
            <div className="flex items-center gap-2">
              <OpenBadge ctx={ctx} showHours={false} className="hidden lg:flex" />
              {phone ? (
                <a href={`tel:${phone}`} className="hidden items-center gap-1.5 text-sm font-semibold text-t-primary md:inline-flex" dir="ltr">
                  <Phone className="size-4" /> {phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, ctx.lang)} className="rounded-full border border-t-border px-3 py-1.5 text-sm font-medium hover:bg-t-muted" />
            </div>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <Checkered />
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const deals = section(ctx, dealsSection);
  const topDeal = deals?.items?.[0];
  return (
    <>
      <section className="relative overflow-hidden bg-t-bg">
        <div aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-t-accent/25 blur-3xl" />
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="t-fade-up">
            {t(h.eyebrow, lang) ? (
              <span className="t-eyebrow inline-flex items-center gap-2">
                <Pizza className="size-4" /> {t(h.eyebrow, lang)}
              </span>
            ) : null}
            <h1 className="font-heading mt-4 text-5xl leading-[1.05] text-t-primary sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-7 text-t-fg" />
            </div>
            {h.badges?.length ? (
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                {h.badges.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-semibold text-t-fg">
                    <span className="flex size-9 items-center justify-center rounded-full bg-t-primary/10 text-t-primary [&_svg]:size-4">
                      <Icon name={b.icon} />
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-0 -rotate-3 rounded-[2rem] bg-t-accent/30" aria-hidden="true" />
            <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-square w-full rounded-[2rem] object-cover shadow-2xl" fallback={<Pizza className="size-20 opacity-30" />} />
            {topDeal ? (
              <Link href="#deals" className="absolute -bottom-5 -start-3 flex items-center gap-3 rounded-full bg-t-primary py-2 pe-6 ps-2 text-t-primary-fg shadow-xl transition hover:scale-105 sm:-start-8">
                <span className="flex size-11 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                  <BadgePercent className="size-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{topDeal.badge || t(rs.deals, lang)}</span>
                  <span className="font-heading block text-lg leading-tight">
                    {t(topDeal.title, lang)} · {formatPKR(topDeal.price)}
                  </span>
                </span>
              </Link>
            ) : null}
          </div>
        </Container>
      </section>
      <Checkered />
    </>
  );
}

/* ---------- Signature: deals as red ticket cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="relative rounded-[var(--t-radius)] bg-t-primary p-2 text-t-primary-fg shadow-lg">
              <span aria-hidden="true" className="absolute -start-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-t-muted" />
              <span aria-hidden="true" className="absolute -end-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-t-muted" />
              <div className="flex h-full flex-col rounded-[calc(var(--t-radius)-4px)] border-2 border-dashed border-t-primary-fg/50 p-5">
                {it.image ? <Img src={it.image} alt="" className="mb-4 aspect-[16/9] w-full rounded-[var(--t-radius)] object-cover" /> : null}
                {it.badge ? <span className="self-start rounded-full bg-t-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-accent-fg">{it.badge}</span> : null}
                <h3 className="font-heading mt-3 text-2xl">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-primary-fg/80">{t(it.description, lang)}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-t-primary-fg/40 pt-4">
                  <span className="font-heading text-3xl">{formatPKR(it.price)}</span>
                  <Link href="/menu" className="t-btn t-btn-accent rounded-full px-4 py-2 text-sm">
                    {t(ui.orderNow, lang)}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured menu grid with "Add" buttons ---------- */
async function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const items = await getFeaturedItems(ctx.tenant.id, fm.count || 6);
  if (!items.length) return null;
  const lang = ctx.lang;
  return (
    <section id="menu" className="py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={fm.eyebrow} title={fm.title} align="left" lang={lang} className="mb-0" />
          <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const name = t(it.name, lang);
            return (
              <li key={it.id} className="t-card group flex flex-col overflow-hidden">
                <Link href={`/menu#item-${it.slug}`} className="relative block aspect-[4/3] overflow-hidden">
                  <Img src={it.imageUrl ?? ""} alt={name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" fallback={<Pizza className="size-10 opacity-30" />} />
                  <TagBadges tags={it.tags} lang={lang} className="absolute start-3 top-3" />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-xl">{name}</h3>
                  {t(it.description, lang) ? <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-lg font-extrabold text-t-primary">
                      {it.sizes.length > 1 ? <span className="me-1 text-xs font-normal text-t-muted-fg">{t(rs.from, lang)}</span> : null}
                      {formatPKR(itemStartingPrice(it))}
                    </span>
                    <Link href={`/menu#item-${it.slug}`} className="t-btn t-btn-primary h-9 rounded-full px-4 text-sm" aria-label={`${t(rs.add, lang)} ${name}`}>
                      <Plus className="size-4" /> {t(rs.add, lang)}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  const chip = "inline-flex items-center rounded-full bg-t-muted px-2.5 py-1 text-xs font-semibold text-t-fg";
  return (
    <section id="delivery" className="border-y border-t-border bg-t-bg py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} />
        {zones.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <li key={z.id} className="t-card flex items-start gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                  <MapPin className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-xl">{z.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={cn(chip, z.fee === 0 && "bg-t-accent text-t-accent-fg")}>{z.fee === 0 ? t(L.freeDelivery, lang) : `${t(ui.deliveryFee, lang)} ${formatPKR(z.fee)}`}</span>
                    {z.minOrder > 0 ? <span className={chip}>{t(rs.minOrder, lang)} {formatPKR(z.minOrder)}</span> : null}
                    {z.etaMins ? <span className={chip}>{z.etaMins} {t(rs.mins, lang)}</span> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">
            <span className={chip}>{t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)}</span>
            {r.minDeliveryOrder > 0 ? <span className={chip}>{t(rs.minOrder, lang)} {formatPKR(r.minDeliveryOrder)}</span> : null}
            <span className={chip}>{r.prepTimeMins} {t(rs.mins, lang)}</span>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: dark band ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-dark py-16 text-t-dark-fg sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-heading text-4xl sm:text-5xl">{t(hs.title, lang)}</h2>
          <OpenBadge ctx={ctx} className="mt-5" />
          <dl className="mt-8 space-y-4 text-sm">
            {c.phone ? (
              <div className="flex items-center gap-3">
                <dt className="flex size-10 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
                  <Phone className="size-4" />
                </dt>
                <dd>
                  <span className="block text-xs uppercase tracking-wider text-t-dark-fg/60">{t(L.callUs, lang)}</span>
                  <a href={`tel:${c.phone}`} className="font-heading text-xl" dir="ltr">
                    {c.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {c.address ? (
              <div className="flex items-center gap-3">
                <dt className="flex size-10 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
                  <MapPin className="size-4" />
                </dt>
                <dd>
                  <span className="block text-xs uppercase tracking-wider text-t-dark-fg/60">{t(L.findUs, lang)}</span>
                  <span>
                    {c.address}
                    {c.city ? `, ${c.city}` : ""}
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="rounded-[var(--t-radius)] border border-t-dark-fg/10 bg-t-dark-fg/5 p-6">
          <HoursTable ctx={ctx} light showStatus={false} />
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
        deals: () => <Deals ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="bg-t-muted" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
