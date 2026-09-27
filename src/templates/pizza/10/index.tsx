/**
 * pizza-10 "Cheesy Cartoon" (#910)
 * Playful cartoon kids-friendly: bubbly yellow header with red pill nav, wobbly CSS blob
 * shapes in the hero, deals as dashed "coupon" cards with a scissors cut line, process as
 * bouncing bubbles and a confetti party-booking CTA.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, PartyPopper, Phone, Pizza, Scissors, Smile, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { ctaSection, heroSection, hoursSection, processSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, FaqBlock, GalleryBlock, HoursTable, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
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
  coupon: ls("Cut out the deal", "ڈیل کاٹ لیں"),
  funTime: ls("Fun time", "مزے کا وقت"),
};

/* wobbly blob shapes (inline styles: the radii are too irregular for utilities) */
const BLOB_A: React.CSSProperties = { borderRadius: "62% 38% 55% 45% / 52% 58% 42% 48%" };
const BLOB_B: React.CSSProperties = { borderRadius: "44% 56% 38% 62% / 46% 40% 60% 54%" };

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
          variant="light"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="border-b-0 bg-t-primary text-t-fg [&_.t-btn-primary]:bg-t-accent [&_.t-btn-primary]:text-t-accent-fg [&_a>span.font-heading]:text-2xl lg:[&_a>span.font-heading]:text-3xl [&_nav_a]:bg-t-accent [&_nav_a]:text-t-accent-fg [&_nav_a:hover]:brightness-110"
          rightSlot={
            <div className="flex items-center gap-2">
              {phone ? (
                <a href={`tel:${phone}`} dir="ltr" className="hidden items-center gap-1.5 rounded-full bg-t-bg px-3 py-1.5 text-sm font-bold md:inline-flex">
                  <Phone className="size-4 text-t-accent" /> {phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-full bg-t-bg px-3 py-1.5 text-sm font-bold" />
            </div>
          }
        />
        {/* bubbly bottom edge of the header */}
        <div aria-hidden="true" className="-mt-px h-5 w-full bg-t-primary" style={{ borderBottomLeftRadius: "50% 100%", borderBottomRightRadius: "50% 100%" }} />
        <main id="main" className="flex-1">{children}</main>
        <div aria-hidden="true" className="h-5 w-full bg-t-dark" style={{ borderTopLeftRadius: "50% 100%", borderTopRightRadius: "50% 100%" }} />
        <SiteFooter ctx={ctx} variant="dark" showHours className="[&_.t-btn]:rounded-full" />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: cartoon blobs ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden pb-14 pt-10 sm:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute -start-16 top-10 size-64 bg-t-primary/40" style={BLOB_A} />
      <div aria-hidden="true" className="pointer-events-none absolute -end-10 bottom-4 size-72 bg-t-accent/25" style={BLOB_B} />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <div className="t-fade-up text-center lg:text-start">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-accent px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-t-accent-fg">
              <Smile className="size-4" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl leading-[1.05] text-t-accent sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-t-muted-fg lg:mx-0">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent px-7 text-base" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 text-base" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-9 flex flex-wrap justify-center gap-2 lg:justify-start">
              {h.badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-full bg-t-muted px-4 py-2 text-sm font-bold">
                  <span className="text-t-accent [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden="true" className="absolute inset-0 -rotate-6 bg-t-primary" style={BLOB_B} />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="relative aspect-square w-full object-cover shadow-xl" style={BLOB_A} fallback={<Pizza className="size-20 text-t-accent/50" />} />
          <span className="absolute -bottom-2 start-2 flex size-24 flex-col items-center justify-center bg-t-accent text-center text-xs font-extrabold uppercase tracking-wider text-t-accent-fg shadow-lg" style={BLOB_B}>
            <PartyPopper className="mb-1 size-6" /> {t(L.funTime, lang)}
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: coupon cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} subtitle={L.coupon} lang={lang} />
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="relative rounded-[2rem] border-4 border-dashed border-t-accent bg-t-bg p-6 text-center shadow-sm">
              <Scissors className="absolute -top-4 start-5 size-7 rotate-90 bg-t-bg px-1 text-t-accent" aria-hidden="true" />
              <span aria-hidden="true" className="absolute -start-3.5 top-1/2 size-6 -translate-y-1/2 rounded-full bg-t-muted" />
              <span aria-hidden="true" className="absolute -end-3.5 top-1/2 size-6 -translate-y-1/2 rounded-full bg-t-muted" />
              {it.image ? <Img src={it.image} alt="" className="mx-auto mb-4 aspect-[3/2] w-full rounded-[1.5rem] object-cover" /> : null}
              {it.badge ? <span className="inline-block rounded-full bg-t-primary px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-t-primary-fg">{it.badge}</span> : null}
              <h3 className="font-heading mt-3 text-2xl text-t-accent">{t(it.title, lang)}</h3>
              <p className="mt-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
              <span aria-hidden="true" className="my-4 block border-t-2 border-dashed border-t-border" />
              <span className="font-heading block text-4xl">{formatPKR(it.price)}</span>
              <Link href="/menu" className="t-btn t-btn-accent mt-5 px-6">
                {t(ui.orderNow, lang)}
              </Link>
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
        className="[&_.t-card]:rounded-[2rem] [&_.t-card]:border-4 [&_.t-card]:border-t-muted [&_img]:rounded-[1.5rem]"
      />
      <Container className="-mt-6 pb-12 text-center sm:-mt-8 sm:pb-16">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-primary px-6" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Process: bouncing bubbles ---------- */
function Process({ ctx }: TemplatePageProps) {
  const p = section(ctx, processSection);
  if (!p || !p.steps?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="process" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={p.eyebrow} title={p.title} lang={lang} />
        <ol className="grid gap-10 sm:grid-cols-3">
          {p.steps.map((s, i) => (
            <li key={i} className={cn("text-center", i % 2 === 1 && "sm:translate-y-8")}>
              <span className="relative mx-auto flex size-28 items-center justify-center bg-t-primary text-t-primary-fg shadow-lg [&_svg]:size-10" style={i % 2 ? BLOB_B : BLOB_A}>
                <Icon name={s.icon} />
                <span className="absolute -end-1 -top-1 flex size-9 items-center justify-center rounded-full bg-t-accent text-sm font-extrabold text-t-accent-fg">{i + 1}</span>
              </span>
              <h3 className="font-heading mt-5 text-2xl text-t-accent">{t(s.title, lang)}</h3>
              <p className="mt-2 text-sm text-t-muted-fg">{t(s.text, lang)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: bubble chips ---------- */
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
          <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-3 rounded-full bg-t-muted py-2.5 pe-5 ps-3 text-sm shadow-sm">
                <span className="flex size-9 items-center justify-center rounded-full bg-t-accent text-t-accent-fg">
                  <MapPin className="size-4" />
                </span>
                <span className="font-extrabold">{z.name}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", z.fee === 0 ? "bg-t-primary text-t-primary-fg" : "bg-t-bg text-t-muted-fg")}>
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

/* ---------- Hours: bubble card ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <div className="mx-auto grid max-w-4xl gap-8 rounded-[2.5rem] bg-t-bg p-6 shadow-sm sm:grid-cols-2 sm:p-10">
          <div>
            <h2 className="font-heading text-3xl text-t-accent sm:text-4xl">{t(hs.title, lang)}</h2>
            <OpenBadge ctx={ctx} className="mt-4" />
            {c.phone ? (
              <a href={`tel:${c.phone}`} dir="ltr" className="font-heading mt-5 inline-flex items-center gap-2 text-2xl">
                <Phone className="size-5 text-t-accent" /> {c.phone}
              </a>
            ) : null}
            {c.address ? (
              <p className="mt-3 flex items-start gap-2 text-sm text-t-muted-fg">
                <MapPin className="mt-0.5 size-4 shrink-0 text-t-accent" />
                <span>
                  {c.address}
                  {c.city ? `, ${c.city}` : ""}
                </span>
              </p>
            ) : null}
          </div>
          <div className="rounded-[2rem] bg-t-muted p-5">
            <HoursTable ctx={ctx} showStatus={false} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- CTA: confetti party booking ---------- */
function PartyCta({ ctx }: TemplatePageProps) {
  const c = section(ctx, ctaSection);
  if (!c) return null;
  const lang = ctx.lang;
  const title = t(c.title, lang);
  const text = t(c.text, lang);
  if (!title && !text) return null;
  return (
    <section id="cta" className="py-14 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-t-accent px-6 py-12 text-center text-t-accent-fg sm:px-12">
          <span aria-hidden="true" className="absolute -start-8 -top-8 size-32 bg-t-primary/40" style={BLOB_A} />
          <span aria-hidden="true" className="absolute -bottom-10 -end-6 size-40 bg-t-primary/30" style={BLOB_B} />
          <div className="relative">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-t-primary text-t-primary-fg">
              <PartyPopper className="size-8" />
            </span>
            <h2 className="font-heading mt-5 text-3xl sm:text-4xl">{title}</h2>
            {text ? <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">{text}</p> : null}
            <div className="mt-8">
              <CtaButton value={c.cta} ctx={ctx} className="t-btn bg-t-primary px-8 text-base text-t-primary-fg hover:brightness-105" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
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
        process: () => <Process ctx={ctx} />,
        about: () => <AboutBlock ctx={ctx} variant="image-left" className="[&_img]:rounded-[2.5rem]" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="bg-t-muted [&_button]:rounded-[2rem]" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="bg-t-muted" />,
        cta: () => <PartyCta ctx={ctx} />,
      })}
      <section className="py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm text-t-muted-fg sm:flex-row">
          <span className="inline-flex items-center gap-2 font-bold">
            <Smile className="size-4 text-t-accent" /> {t(L.funTime, ctx.lang)}
          </span>
          <SmartLink href="/menu" ctx={ctx} className="font-extrabold text-t-accent hover:underline">
            {t(ui.orderNow, ctx.lang)} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
