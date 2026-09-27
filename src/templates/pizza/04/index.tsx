/**
 * pizza-04 "Napoli Verde" (#904)
 * Fresh Italian green & white: tricolour hairline above a white serif header with a
 * "reserve a table" link, ingredient-photo hero, the featured menu set like a printed
 * menu card with dotted leaders between name and price, film-strip gallery and airy space.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Leaf, MapPin, Phone, Timer, UtensilsCrossed } from "lucide-react";
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
  laCarta: ls("La carta", "مینیو"),
  fresh: ls("Fresh ingredients, daily", "روزانہ تازہ اجزاء"),
};

/* ---------- signature: tricolour hairline ---------- */
function Tricolore({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex h-1 w-full", className)}>
      <span className="flex-1 bg-t-primary" />
      <span className="flex-1 bg-t-bg" />
      <span className="flex-1 bg-t-accent" />
    </div>
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="primary" />
        <Tricolore />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: ui.menu, href: "/menu" }}
          className="[&_nav_a]:font-heading [&_nav_a]:text-base [&_nav_a]:tracking-wide"
          rightSlot={
            <div className="flex items-center gap-2">
              {ctx.settings.restaurant.reservations ? (
                <Link href="/reserve" className="hidden items-center gap-1.5 text-sm font-semibold text-t-primary hover:underline lg:inline-flex">
                  <CalendarCheck className="size-4" /> {t(rs.reserveTable, lang)}
                </Link>
              ) : null}
              {c.phone ? (
                <a href={`tel:${c.phone}`} dir="ltr" className="hidden items-center gap-1.5 text-sm font-semibold md:inline-flex">
                  <Phone className="size-4 text-t-accent" /> {c.phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(rs.yourOrder, lang)} className="border border-t-border px-3 py-1.5 text-sm font-medium hover:bg-t-muted" />
            </div>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <Tricolore />
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: ingredients left, serif headline right ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="bg-t-bg">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="relative order-2 lg:order-1">
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/5] w-full rounded-[var(--t-radius)] object-cover" fallback={<Leaf className="size-16 opacity-25" />} />
          <span className="absolute -bottom-5 end-6 hidden items-center gap-2 rounded-[var(--t-radius)] bg-t-primary px-4 py-3 text-sm font-semibold text-t-primary-fg shadow-lg sm:flex">
            <Leaf className="size-4" /> {t(L.fresh, lang)}
          </span>
        </div>
        <div className="t-fade-up order-1 lg:order-2">
          {h.eyebrow ? <span className="t-eyebrow">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-3 text-4xl leading-[1.08] text-t-fg sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <Tricolore className="mt-6 w-24" />
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            {ctx.settings.restaurant.reservations ? (
              <Link href="/reserve" className="t-btn t-btn-outline px-7 text-t-fg">
                <CalendarCheck className="size-4" /> {t(rs.reserveTable, lang)}
              </Link>
            ) : (
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline px-7 text-t-fg" />
            )}
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-3 border-s-2 border-t-primary/40 ps-3 text-sm font-medium">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: framed menu cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid gap-6 md:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="border border-t-primary/30 bg-t-bg p-1.5">
              <div className="flex h-full flex-col border border-t-primary/20 p-5 text-center">
                {it.image ? <Img src={it.image} alt="" className="mb-4 aspect-[3/2] w-full rounded-[var(--t-radius)] object-cover" /> : null}
                {it.badge ? <span className="mx-auto mb-2 inline-block bg-t-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-t-accent-fg">{it.badge}</span> : null}
                <h3 className="font-heading text-2xl">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm italic text-t-muted-fg">{t(it.description, lang)}</p>
                <span aria-hidden="true" className="mx-auto mt-4 block h-px w-12 bg-t-primary/40" />
                <span className="font-heading mt-4 block text-3xl text-t-accent">{formatPKR(it.price)}</span>
                <Link href="/menu" className="t-btn t-btn-primary mt-5 px-5 text-sm">
                  {t(ui.orderNow, lang)}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured menu: printed menu with dotted leaders ---------- */
async function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  const items = await getFeaturedItems(ctx.tenant.id, fm.count || 6);
  if (!items.length) return null;
  return (
    <section id="menu" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-4xl border border-t-border bg-t-bg p-6 sm:p-10">
          <Tricolore className="mx-auto mb-6 w-28" />
          <div className="text-center">
            <span className="t-eyebrow">{fm.eyebrow || t(L.laCarta, lang)}</span>
            <h2 className="font-heading mt-2 text-3xl sm:text-4xl">{t(fm.title, lang)}</h2>
          </div>
          <ul className="mt-10 grid gap-x-12 gap-y-6 lg:grid-cols-2">
            {items.map((item) => {
              const name = t(item.name, lang);
              const desc = t(item.description, lang);
              return (
                <li key={item.id}>
                  <Link href={`/menu#item-${item.slug}`} className="group block">
                    <span className="flex items-baseline gap-2">
                      <span className="font-heading shrink-0 text-xl group-hover:text-t-primary">{name}</span>
                      <span aria-hidden="true" className="min-w-8 flex-1 translate-y-[-0.2rem] border-b border-dotted border-t-border" />
                      <span className="font-heading shrink-0 text-xl text-t-accent">
                        {item.sizes.length > 1 ? <span className="me-1 align-middle text-[11px] font-normal uppercase tracking-wider text-t-muted-fg">{t(rs.from, lang)}</span> : null}
                        {formatPKR(itemStartingPrice(item))}
                      </span>
                    </span>
                    {desc ? <span className="mt-1 block text-sm italic text-t-muted-fg">{desc}</span> : null}
                  </Link>
                  <TagBadges tags={item.tags} lang={lang} className="mt-2" />
                </li>
              );
            })}
          </ul>
          <div className="mt-10 text-center">
            <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: dotted-leader list ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} />
        {zones.length ? (
          <ul className="mx-auto grid max-w-4xl gap-x-12 gap-y-4 lg:grid-cols-2">
            {zones.map((z) => (
              <li key={z.id} className="flex items-baseline gap-2 text-sm">
                <span className="flex shrink-0 items-center gap-1.5 font-semibold">
                  <MapPin className="size-3.5 text-t-primary" /> {z.name}
                </span>
                <span aria-hidden="true" className="min-w-6 flex-1 translate-y-[-0.2rem] border-b border-dotted border-t-border" />
                <span className="shrink-0 font-semibold text-t-accent">{z.fee === 0 ? t(L.freeDelivery, lang) : formatPKR(z.fee)}</span>
                {z.minOrder > 0 ? (
                  <span className="shrink-0 text-xs text-t-muted-fg">
                    · {t(rs.minOrder, lang)} {formatPKR(z.minOrder)}
                  </span>
                ) : null}
                {z.etaMins ? (
                  <span className="shrink-0 text-xs text-t-muted-fg">
                    · {z.etaMins} {t(rs.mins, lang)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-t-muted-fg">
            {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)} · {r.prepTimeMins} {t(rs.mins, lang)}
          </p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: printed card with tricolour crest ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="py-16 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="border border-t-border">
          <Tricolore />
          <div className="p-6 sm:p-8">
            <HoursTable ctx={ctx} title={t(hs.title, lang)} className="[&_h3]:font-heading [&_h3]:font-normal" />
          </div>
        </div>
        <div className="flex flex-col gap-5 rounded-[var(--t-radius)] bg-t-muted p-6 sm:p-8">
          <OpenBadge ctx={ctx} />
          {c.address ? (
            <p className="flex items-start gap-2 text-sm text-t-muted-fg">
              <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" />
              <span>
                {c.address}
                {c.city ? `, ${c.city}` : ""}
              </span>
            </p>
          ) : null}
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="font-heading inline-flex items-center gap-2 text-2xl text-t-primary">
              <Phone className="size-5" /> {c.phone}
            </a>
          ) : null}
          <p className="inline-flex items-center gap-2 text-sm text-t-muted-fg">
            <Timer className="size-4 text-t-accent" /> {ctx.settings.restaurant.prepTimeMins} {t(rs.mins, lang)}
          </p>
          {ctx.settings.restaurant.reservations ? (
            <Link href="/reserve" className="t-btn t-btn-primary mt-auto self-start px-6">
              <UtensilsCrossed className="size-4" /> {t(rs.reserveTable, lang)}
            </Link>
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
        deals: () => <Deals ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="bg-t-muted" />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" className="bg-t-muted" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
