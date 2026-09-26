/**
 * pizza-06 "Family Feast" (#906)
 * Friendly family deals in blue & yellow: navy header with a rounded yellow order button,
 * a combo photo collage hero with a big "from" price badge, deals as wide horizontal combo
 * cards with serving chips, list-style menu preview and a party-orders CTA banner.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, PartyPopper, Phone, Pizza, Timer, Users } from "lucide-react";
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
  dealsFrom: ls("Deals from", "ڈیلز شروع"),
  bulkOrders: ls("Party & bulk orders", "پارٹی اور بلک آرڈرز"),
};

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const lang = ctx.lang;
  const phone = ctx.settings.contact.phone;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="accent" />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="[&_.t-btn-primary]:rounded-full [&_.t-btn-primary]:bg-t-accent [&_.t-btn-primary]:text-t-accent-fg [&_nav_a]:rounded-full"
          rightSlot={
            <div className="flex items-center gap-2">
              {phone ? (
                <a href={`tel:${phone}`} dir="ltr" className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold md:inline-flex">
                  <Phone className="size-4 text-t-accent" /> {phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/20" />
            </div>
          }
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: combo collage + big price badge ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const deals = section(ctx, dealsSection);
  const lowest = deals?.items?.length ? Math.min(...deals.items.map((it) => it.price).filter((p) => p > 0)) : 0;
  const extra = (h.slides ?? []).slice(0, 2);
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-flex rounded-full bg-t-accent px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-t-accent-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-5 text-4xl leading-[1.05] text-t-primary sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-full px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-full bg-t-accent px-7 text-t-accent-fg hover:brightness-95" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full border-2 border-t-primary/20 bg-t-bg px-4 py-2 text-sm font-bold">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            <Img src={h.image} alt="" className="col-span-3 aspect-[16/10] w-full rounded-[var(--t-radius)] object-cover shadow-lg" fallback={<Pizza className="size-16 opacity-25" />} />
            {extra.map((src, i) => (
              <Img key={i} src={src} alt="" className="aspect-square w-full rounded-[var(--t-radius)] object-cover shadow" />
            ))}
            {extra.length ? (
              <div className="flex aspect-square items-center justify-center rounded-[var(--t-radius)] bg-t-primary text-center text-t-primary-fg">
                <Users className="size-10" />
              </div>
            ) : null}
          </div>
          {lowest > 0 ? (
            <span className="absolute -bottom-6 -start-3 flex size-28 flex-col items-center justify-center rounded-full bg-t-accent text-center text-t-accent-fg shadow-xl sm:-start-6 sm:size-32">
              <span className="text-[10px] font-extrabold uppercase tracking-widest">{t(L.dealsFrom, lang)}</span>
              <span className="font-heading text-xl leading-tight sm:text-2xl">{formatPKR(lowest)}</span>
            </span>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: wide combo cards with serving chips ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="space-y-5">
          {d.items.map((it, i) => (
            <li key={i} className="grid gap-5 overflow-hidden rounded-[var(--t-radius)] border-2 border-t-muted bg-t-bg p-4 shadow-sm transition hover:border-t-primary/30 sm:grid-cols-[14rem_1fr_auto] sm:items-center sm:p-5">
              <Img src={it.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover sm:aspect-square" fallback={<Pizza className="size-10 opacity-25" />} />
              <div>
                <h3 className="font-heading text-2xl text-t-primary sm:text-3xl">{t(it.title, lang)}</h3>
                <p className="mt-2 text-t-muted-fg">{t(it.description, lang)}</p>
                {it.badge ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-t-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-accent-fg">
                    <Users className="size-3.5" /> {it.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <span className="font-heading text-3xl text-t-fg sm:text-4xl">{formatPKR(it.price)}</span>
                <Link href="/menu" className="t-btn t-btn-primary rounded-full px-6">
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

/* ---------- Featured menu (module kit, list layout) ---------- */
function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  return (
    <div id="menu" className="bg-t-muted">
      <FeaturedItems ctx={ctx} take={fm.count || 6} title={t(fm.title, lang) || undefined} layout="list" className="[&_.t-btn]:rounded-full [&_.t-card]:border-2 [&_.t-card]:border-t-bg" />
      <Container className="-mt-6 pb-12 text-center sm:-mt-8 sm:pb-16">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full px-6 text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas: zone cards with big fees ---------- */
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
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {zones.map((z) => (
              <li key={z.id} className="rounded-[var(--t-radius)] bg-t-muted p-5 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
                  <MapPin className="size-5" />
                </span>
                <h3 className="font-heading mt-3 text-xl">{z.name}</h3>
                <p className={cn("font-heading mt-2 text-2xl", z.fee === 0 ? "text-t-primary" : "text-t-fg")}>{z.fee === 0 ? t(L.freeDelivery, lang) : formatPKR(z.fee)}</p>
                <p className="mt-1 text-xs font-semibold text-t-muted-fg">
                  {z.minOrder > 0 ? `${t(rs.minOrder, lang)} ${formatPKR(z.minOrder)}` : null}
                  {z.minOrder > 0 && z.etaMins ? " · " : null}
                  {z.etaMins ? `${z.etaMins} ${t(rs.mins, lang)}` : null}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-3">
            <span className="rounded-full bg-t-muted px-4 py-2 text-sm font-bold">
              {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-t-accent px-4 py-2 text-sm font-bold text-t-accent-fg">
              <Timer className="size-4" /> {r.prepTimeMins} {t(rs.mins, lang)}
            </span>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: navy panel card ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[var(--t-radius)] bg-t-bg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-t-dark px-6 py-5 text-t-dark-fg">
            <h2 className="font-heading text-2xl sm:text-3xl">{t(hs.title, lang)}</h2>
            <OpenBadge ctx={ctx} showHours={false} />
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <HoursTable ctx={ctx} showStatus={false} />
            <div className="flex flex-col gap-3 rounded-[var(--t-radius)] bg-t-muted p-5 text-sm">
              {c.phone ? (
                <a href={`tel:${c.phone}`} dir="ltr" className="font-heading flex items-center gap-2 text-2xl text-t-primary">
                  <Phone className="size-5" /> {c.phone}
                </a>
              ) : null}
              {c.address ? (
                <p className="flex items-start gap-2 text-t-muted-fg">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" />
                  <span>
                    {c.address}
                    {c.city ? `, ${c.city}` : ""}
                  </span>
                </p>
              ) : null}
              <p className="mt-auto inline-flex items-center gap-2 font-bold">
                <PartyPopper className="size-4 text-t-accent" /> {t(L.bulkOrders, lang)}
              </p>
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
        deals: () => <Deals ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => (
          <ProcessBlock ctx={ctx} variant="steps" className="[&_ol>li_span:first-child]:bg-t-accent [&_ol>li_span:first-child]:text-t-accent-fg" />
        ),
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="bg-t-muted" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} />,
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
