/**
 * pizza-03 "PizzaGo" (#903)
 * Fast-delivery app style: orange header with a "deliver to" location chip, quick-order card
 * over an orange gradient with an ETA badge and deal chips, delivery areas as a fee chip cloud,
 * app-style step cards, pill everything and an order bar pinned to the bottom on mobile.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bike, MapPin, Phone, Pizza, Search, ShoppingBag, Timer, Utensils } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { FeaturedItems, OpenBadge } from "@/modules/restaurant/ui";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { getDeliveryZones } from "@/modules/restaurant/queries";

const L = {
  freeDelivery: ls("Free delivery", "مفت ڈیلیوری"),
  deliverTo: ls("Deliver to", "ڈیلیوری"),
  quickOrder: ls("Start your order", "آرڈر شروع کریں"),
  avgTime: ls("Average delivery", "اوسط ڈیلیوری"),
};

/* ---------- Layout: orange app chrome + always-visible order bar ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="border-b-0 bg-t-primary text-t-primary-fg [&_.t-btn-primary]:rounded-full [&_.t-btn-primary]:bg-white [&_.t-btn-primary]:text-t-primary [&_nav_a]:rounded-full"
          rightSlot={
            <div className="flex items-center gap-2">
              {c.city ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold sm:inline-flex">
                  <MapPin className="size-3.5" /> {t(L.deliverTo, lang)}: {c.city}
                </span>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25" />
            </div>
          }
        />
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" showHours />
        {/* always-visible order bar (mobile); the cart bar stacks above it once items are added */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-px border-t border-t-border bg-t-card md:hidden">
          <Link href="/menu" className="t-btn t-btn-primary flex-1 rounded-none py-3.5 text-sm">
            <ShoppingBag className="size-4" /> {t(ui.orderNow, lang)}
          </Link>
          {c.phone ? (
            <a href={`tel:${c.phone}`} className="flex w-16 items-center justify-center bg-t-muted text-t-primary" aria-label={t(ui.callNow, lang)}>
              <Phone className="size-5" />
            </a>
          ) : null}
        </div>
        <CartBar ctx={rc} className="pb-20 pe-24 sm:pe-4 md:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: quick-order card over an orange gradient ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const deals = section(ctx, dealsSection);
  const r = ctx.settings.restaurant;
  const types = [
    r.delivery ? { label: t(ui.delivery, lang), icon: <Bike className="size-4" /> } : null,
    r.pickup ? { label: t(ui.pickup, lang), icon: <ShoppingBag className="size-4" /> } : null,
    r.dineIn ? { label: t(ui.dineIn, lang), icon: <Utensils className="size-4" /> } : null,
  ].filter((x): x is { label: string; icon: React.ReactNode } => x !== null);
  return (
    <section className="relative overflow-hidden bg-t-primary text-t-primary-fg">
      <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-20 size-80 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 start-1/4 size-80 rounded-full bg-t-accent/30 blur-3xl" />
      <Container className="relative grid items-center gap-10 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 opacity-90">{t(h.subtitle, lang)}</p>
          {h.badges?.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
                  <span className="[&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {/* quick-order card */}
        <div className="rounded-[var(--t-radius)] bg-t-card p-5 text-t-fg shadow-2xl sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-t-muted-fg">{t(L.quickOrder, lang)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-t-accent px-3 py-1 text-xs font-bold text-t-accent-fg">
              <Timer className="size-3.5" /> {r.prepTimeMins} {t(rs.mins, lang)}
            </span>
          </div>
          <Link
            href="/menu"
            className="t-input mt-4 flex items-center gap-2 text-t-muted-fg transition hover:border-t-primary"
            aria-label={t(rs.searchMenu, lang)}
          >
            <Search className="size-4 shrink-0" /> {t(rs.searchMenu, lang)}
          </Link>
          {types.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {types.map((ty) => (
                <li key={ty.label} className="inline-flex items-center gap-1.5 rounded-full bg-t-muted px-3 py-1.5 text-xs font-semibold">
                  {ty.icon} {ty.label}
                </li>
              ))}
            </ul>
          ) : null}
          {deals?.items?.length ? (
            <ul className="mt-5 space-y-2">
              {deals.items.slice(0, 3).map((it, i) => (
                <li key={i}>
                  <Link href="#deals" className="flex items-center justify-between gap-3 rounded-[var(--t-radius)] bg-t-muted px-4 py-3 text-sm font-semibold transition hover:bg-t-accent/15">
                    <span className="flex min-w-0 items-center gap-2">
                      <Pizza className="size-4 shrink-0 text-t-primary" />
                      <span className="truncate">{t(it.title, lang)}</span>
                    </span>
                    <span className="shrink-0 text-t-primary">{formatPKR(it.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary flex-1 rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-fg" />
          </div>
          <OpenBadge ctx={ctx} className="mt-4" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: app-style cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={lang} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="flex flex-col overflow-hidden rounded-[var(--t-radius)] bg-t-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative">
                <Img src={it.image} alt="" className="aspect-[16/9] w-full object-cover" fallback={<Pizza className="size-10 opacity-30" />} />
                {it.badge ? <span className="absolute start-3 top-3 rounded-full bg-t-accent px-3 py-1 text-xs font-bold text-t-accent-fg shadow">{it.badge}</span> : null}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading text-lg font-bold">{t(it.title, lang)}</h3>
                <p className="mt-1 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="text-2xl font-extrabold text-t-primary">{formatPKR(it.price)}</span>
                  <Link href="/menu" className="t-btn t-btn-primary h-10 rounded-full px-5 text-sm">
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

/* ---------- Featured menu (module kit, honouring the section) ---------- */
function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  return (
    <div id="menu">
      <FeaturedItems
        ctx={ctx}
        take={fm.count || 6}
        title={t(fm.title, lang) || undefined}
        className="[&_.t-btn]:rounded-full [&_.t-card]:shadow-sm [&_.t-card]:transition [&_.t-card:hover]:shadow-lg"
      />
      <Container className="-mt-6 pb-10 text-center sm:-mt-8 sm:pb-14">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-6 text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas: fee chip cloud ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="py-14 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} />
        {zones.length ? (
          <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-2 rounded-full border border-t-border bg-t-card py-2 pe-4 ps-2 text-sm shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
                  <MapPin className="size-4" />
                </span>
                <span className="font-bold">{z.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", z.fee === 0 ? "bg-t-accent text-t-accent-fg" : "bg-t-muted text-t-muted-fg")}>
                  {z.fee === 0 ? t(L.freeDelivery, lang) : formatPKR(z.fee)}
                </span>
                {z.minOrder > 0 ? (
                  <span className="text-xs text-t-muted-fg">
                    {t(rs.minOrder, lang)} {formatPKR(z.minOrder)}
                  </span>
                ) : null}
                {z.etaMins ? (
                  <span className="inline-flex items-center gap-1 text-xs text-t-muted-fg">
                    <Timer className="size-3" /> {z.etaMins} {t(rs.mins, lang)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-3">
            <span className="rounded-full bg-t-muted px-3 py-1.5 text-sm font-semibold">
              {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)}
            </span>
            {r.minDeliveryOrder > 0 ? (
              <span className="rounded-full bg-t-muted px-3 py-1.5 text-sm font-semibold">
                {t(rs.minOrder, lang)} {formatPKR(r.minDeliveryOrder)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-t-accent px-3 py-1.5 text-sm font-semibold text-t-accent-fg">
              <Timer className="size-4" /> {t(L.avgTime, lang)} {r.prepTimeMins} {t(rs.mins, lang)}
            </span>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: app card ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-muted py-14 sm:py-20">
      <Container className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--t-radius)] bg-t-card p-6 shadow-sm lg:col-span-2">
          <HoursTable ctx={ctx} title={t(hs.title, lang)} />
        </div>
        <div className="flex flex-col gap-4 rounded-[var(--t-radius)] bg-t-primary p-6 text-t-primary-fg">
          <OpenBadge ctx={ctx} showHours={false} />
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="flex items-center gap-2 text-2xl font-extrabold">
              <Phone className="size-5" /> {c.phone}
            </a>
          ) : null}
          {c.address ? (
            <p className="flex items-start gap-2 text-sm opacity-90">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>
                {c.address}
                {c.city ? `, ${c.city}` : ""}
              </span>
            </p>
          ) : null}
          <Link href="/menu" className="t-btn mt-auto rounded-full bg-white px-5 text-t-primary">
            {t(ui.orderNow, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
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
        process: () => (
          <ProcessBlock
            ctx={ctx}
            variant="steps"
            className="[&_ol>li]:rounded-[var(--t-radius)] [&_ol>li]:bg-t-muted [&_ol>li]:p-6 [&_ol>li_span:first-child]:bg-t-primary [&_ol>li_span:first-child]:text-t-primary-fg"
          />
        ),
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted [&_img]:rounded-[var(--t-radius)]" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="strip" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_.t-btn]:rounded-full" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
