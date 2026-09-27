/**
 * pizza-05 "Midnight Slice" (#905)
 * Late-night neon: black chrome with a glowing pink wordmark, an always-running marquee
 * ticker of deals under the header, neon-outlined hero slice, deals as glowing bordered
 * cards and an hours block that plays up the late-night window.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Moon, MapPin, Phone, Pizza, Sparkles, Timer, Zap } from "lucide-react";
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
  lateNight: ls("Late night", "رات گئے"),
  tonight: ls("Tonight", "آج رات"),
};

const GLOW = "shadow-[0_0_25px_color-mix(in_srgb,var(--t-primary)_45%,transparent)]";
const GLOW_HOVER = "hover:shadow-[0_0_25px_color-mix(in_srgb,var(--t-primary)_45%,transparent)]";

/* ---------- signature: deals marquee ticker ---------- */
function Ticker({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  const lang = ctx.lang;
  const items = d?.items?.length ? d.items : [];
  if (!items.length) return null;
  const line = (
    <span className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2 px-6 text-sm font-bold uppercase tracking-[0.2em]">
          <Sparkles className="size-3.5 text-t-accent" />
          {t(it.title, lang)}
          <span className="text-t-primary">{formatPKR(it.price)}</span>
          {it.badge ? <span className="text-t-muted-fg">· {it.badge}</span> : null}
        </span>
      ))}
    </span>
  );
  return (
    <div className="overflow-hidden border-y border-t-border bg-t-muted py-2 text-t-fg">
      <div className="t-marquee flex w-max">
        {line}
        <span aria-hidden="true" className="flex shrink-0 items-center">
          {line}
        </span>
      </div>
    </div>
  );
}

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
          className="bg-t-dark [&_a>span.font-heading]:text-t-primary [&_a>span.font-heading]:drop-shadow-[0_0_14px_var(--t-primary)] [&_nav_a]:uppercase [&_nav_a]:tracking-wider"
          rightSlot={
            <div className="flex items-center gap-2">
              <OpenBadge ctx={ctx} showHours={false} className="hidden lg:flex" />
              {phone ? (
                <a href={`tel:${phone}`} dir="ltr" className="hidden items-center gap-1.5 text-sm font-semibold text-t-primary md:inline-flex">
                  <Phone className="size-4" /> {phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-[var(--t-radius)] border border-t-primary px-3 py-1.5 text-sm font-bold text-t-primary hover:bg-t-primary/10" />
            </div>
          }
        />
        <Ticker ctx={ctx} />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter ctx={ctx} variant="dark" showHours className="border-t border-t-border" />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: neon-outlined slice ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -start-32 top-10 size-96 rounded-full bg-t-primary/25 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -end-24 bottom-0 size-96 rounded-full bg-t-accent/30 blur-[100px]" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-t-primary px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-t-primary">
              <Moon className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-5xl uppercase leading-[0.95] text-t-fg drop-shadow-[0_0_30px_color-mix(in_srgb,var(--t-primary)_55%,transparent)] sm:text-7xl lg:text-8xl">
            {t(h.title, lang)}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className={cn("t-btn t-btn-primary px-7 uppercase", GLOW)} icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border border-t-accent px-7 uppercase text-t-accent hover:bg-t-accent/10" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap gap-2">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full bg-t-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-t-fg">
                  <span className="text-t-accent [&_svg]:size-3.5">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-0 rounded-full bg-t-primary/30 blur-3xl" />
          <Img
            src={h.image}
            loading="eager"
            fetchPriority="high"
            alt=""
            className={cn("relative aspect-square w-full rounded-full border-2 border-t-primary object-cover", GLOW)}
            fallback={<Pizza className="size-20 text-t-primary/60" />}
          />
          <span className={cn("absolute -bottom-3 start-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-t-accent px-5 py-2 text-sm font-bold uppercase tracking-wider text-t-accent-fg rtl:translate-x-1/2", GLOW)}>
            <Zap className="size-4" /> {t(L.tonight, lang)}
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: neon-bordered cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} className="[&_h2]:uppercase" />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li
              key={i}
              className={cn("flex flex-col overflow-hidden rounded-[var(--t-radius)] border-2 border-t-primary bg-t-card transition hover:-translate-y-1", GLOW_HOVER)}
            >
              {it.image ? <Img src={it.image} alt="" className="aspect-[16/9] w-full object-cover opacity-90" /> : null}
              <div className="flex flex-1 flex-col p-5">
                {it.badge ? (
                  <span className="self-start rounded-full border border-t-accent px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-t-accent">{it.badge}</span>
                ) : null}
                <h3 className="font-heading mt-3 text-3xl uppercase text-t-primary">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="font-heading text-3xl text-t-fg">{formatPKR(it.price)}</span>
                  <Link href="/menu" className="t-btn t-btn-accent px-4 py-2 text-sm uppercase">
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
    <div id="menu" className="bg-t-muted">
      <FeaturedItems
        ctx={ctx}
        take={fm.count || 6}
        title={t(fm.title, lang) || undefined}
        className="[&_.t-card]:border-t-border [&_.t-card]:transition [&_.t-card:hover]:border-t-primary [&_h2]:uppercase"
      />
      <Container className="-mt-6 pb-12 text-center sm:-mt-8 sm:pb-16">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn border border-t-primary px-6 uppercase text-t-primary hover:bg-t-primary/10" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas: neon chips ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} className="[&_h2]:uppercase" />
        {zones.length ? (
          <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-2 rounded-full border border-t-primary/50 bg-t-card px-4 py-2 text-sm transition hover:border-t-primary">
                <MapPin className="size-4 text-t-primary" />
                <span className="font-bold uppercase tracking-wider">{z.name}</span>
                <span className={cn("text-xs font-semibold", z.fee === 0 ? "text-t-accent" : "text-t-muted-fg")}>
                  {z.fee === 0 ? t(L.freeDelivery, lang) : `${t(ui.deliveryFee, lang)} ${formatPKR(z.fee)}`}
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
          <p className="text-center text-sm text-t-muted-fg">
            {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)} · {r.prepTimeMins} {t(rs.mins, lang)}
          </p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: late-night panel ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-muted py-16 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="t-eyebrow inline-flex items-center gap-2 text-t-accent">
            <Moon className="size-4" /> {t(L.lateNight, lang)}
          </span>
          <h2 className="font-heading mt-2 text-4xl uppercase sm:text-5xl">{t(hs.title, lang)}</h2>
          <OpenBadge ctx={ctx} className="mt-5" />
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="font-heading mt-6 inline-flex items-center gap-2 text-3xl text-t-primary">
              <Phone className="size-6" /> {c.phone}
            </a>
          ) : null}
          {c.address ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-t-muted-fg">
              <MapPin className="mt-0.5 size-4 shrink-0 text-t-accent" />
              <span>
                {c.address}
                {c.city ? `, ${c.city}` : ""}
              </span>
            </p>
          ) : null}
        </div>
        <div className={cn("rounded-[var(--t-radius)] border-2 border-t-primary bg-t-card p-6 sm:p-8", GLOW)}>
          <HoursTable ctx={ctx} showStatus={false} className="[&_td]:py-2.5 [&_td]:uppercase [&_td]:tracking-wide" />
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
          <ProcessBlock ctx={ctx} variant="steps" className="[&_ol>li_span:first-child]:border [&_ol>li_span:first-child]:border-t-accent [&_ol>li_span:first-child]:text-t-accent [&_h2]:uppercase" />
        ),
        about: () => <AboutBlock ctx={ctx} variant="centered" className="bg-t-muted [&_h2]:uppercase" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} className="[&_h2]:uppercase [&_img]:opacity-90" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="[&_h2]:uppercase" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted [&_h2]:uppercase" />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
