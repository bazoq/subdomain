/**
 * pizza-08 "Desi Tandoor Pizza" (#908)
 * Desi flavours, spicy & vibrant: saffron header framed by truck-art pattern borders with a
 * green order button and WhatsApp, chilli-badged hero with spice chips, deals as truck-art
 * cards with bright borders and ribbons, and Urdu-friendly testimonials.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flame, MapPin, MessageCircle, Phone, Pizza, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn, formatPKR, whatsappLink } from "@/lib/utils";
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
  spiceLevel: ls("Spice level", "مصالحے کا لیول"),
  desiTaste: ls("Desi taste", "دیسی ذائقہ"),
};

/* ---------- signature: truck-art pattern border ---------- */
function TruckArt({ className, thick }: { className?: string; thick?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(thick ? "h-4" : "h-2.5", "w-full", className)}
      style={{
        backgroundImage: "repeating-linear-gradient(135deg, var(--t-accent) 0 12px, var(--t-primary) 12px 24px, var(--t-secondary) 24px 36px)",
      }}
    />
  );
}

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  const wa = c.whatsapp || c.phone;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <TruckArt thick />
        <SiteHeader
          ctx={ctx}
          variant="dark"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="bg-t-primary text-t-primary-fg [&_.t-btn-primary]:bg-t-secondary [&_.t-btn-primary]:text-t-secondary-fg [&_a>span.font-heading]:uppercase [&_a>span.font-heading]:tracking-wide"
          rightSlot={
            <div className="flex items-center gap-2">
              {wa ? (
                <a
                  href={whatsappLink(wa, `${t(ui.orderNow, lang)} — ${ctx.tenant.name}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-1.5 rounded-[var(--t-radius)] bg-t-primary-fg/15 px-3 py-1.5 text-sm font-bold sm:inline-flex"
                >
                  <MessageCircle className="size-4" /> {t(ui.whatsapp, lang)}
                </a>
              ) : null}
              {c.phone ? (
                <a href={`tel:${c.phone}`} dir="ltr" className="hidden items-center gap-1.5 text-sm font-bold md:inline-flex">
                  <Phone className="size-4" /> {c.phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-[var(--t-radius)] bg-t-accent px-3 py-1.5 text-sm font-bold text-t-accent-fg" />
            </div>
          }
        />
        <TruckArt />
        <main id="main" className="flex-1">{children}</main>
        <TruckArt thick />
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: tandoori heat ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative overflow-hidden bg-t-muted">
      <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 size-72 rounded-full bg-t-accent/40 blur-3xl" />
      <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div className="t-fade-up">
          {t(h.eyebrow, lang) ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-t-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-t-secondary-fg">
              <Flame className="size-3.5" /> {t(h.eyebrow, lang)}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 flex flex-wrap items-center gap-3 text-4xl uppercase leading-[1.05] text-t-primary sm:text-5xl lg:text-6xl">
            <Flame className="size-9 shrink-0 text-t-accent sm:size-11" aria-hidden="true" />
            {t(h.title, lang)}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          {h.badges?.length ? (
            <div className="mt-7">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-t-secondary">{t(L.spiceLevel, lang)}</span>
              <ul className="mt-3 flex flex-wrap gap-2">
                {h.badges.map((b, i) => (
                  <li key={i} className="inline-flex items-center gap-2 rounded-[var(--t-radius)] border-2 border-t-accent bg-t-bg px-3 py-1.5 text-sm font-bold">
                    <span className="text-t-primary [&_svg]:size-4">
                      <Icon name={b.icon} />
                    </span>
                    {b.text}
                    <span className="flex gap-0.5 text-t-primary" aria-hidden="true">
                      {Array.from({ length: Math.min(i + 1, 3) }).map((_, k) => (
                        <Flame key={k} className="size-3" />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn bg-t-secondary px-7 text-t-secondary-fg hover:brightness-110" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-primary px-7" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <TruckArt thick className="rounded-t-[var(--t-radius)]" />
          <Img src={h.image} loading="eager" fetchPriority="high" alt="" className="aspect-[4/3] w-full border-x-4 border-t-accent object-cover" fallback={<Pizza className="size-16 opacity-25" />} />
          <TruckArt thick className="rounded-b-[var(--t-radius)]" />
          <span className="absolute -bottom-5 start-4 inline-flex items-center gap-2 rounded-full bg-t-primary px-4 py-2 text-sm font-bold text-t-primary-fg shadow-lg">
            <Flame className="size-4 text-t-accent" /> {t(L.desiTaste, lang)}
          </span>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: truck-art cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} className="[&_h2]:uppercase" />
        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="overflow-hidden rounded-[var(--t-radius)] border-4 border-t-accent bg-t-bg shadow-md transition hover:-translate-y-1">
              <TruckArt />
              <div className="relative">
                {it.image ? <Img src={it.image} alt="" className="aspect-[16/9] w-full object-cover" /> : null}
                {it.badge ? (
                  <span className="absolute -start-1 top-4 rounded-e-full bg-t-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-t-secondary-fg shadow">{it.badge}</span>
                ) : null}
              </div>
              <div className="p-5 text-center">
                <h3 className="font-heading text-2xl uppercase text-t-primary">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
                <div className="mt-5 flex items-center justify-center gap-4">
                  <span className="font-heading text-3xl">{formatPKR(it.price)}</span>
                  <Link href="/menu" className="t-btn bg-t-secondary px-5 text-sm text-t-secondary-fg hover:brightness-110">
                    {t(ui.orderNow, lang)}
                  </Link>
                </div>
              </div>
              <TruckArt />
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
        className="[&_.t-card]:border-2 [&_.t-card]:border-t-accent [&_h2]:uppercase [&_h3]:uppercase"
      />
      <Container className="-mt-6 pb-12 text-center sm:-mt-8 sm:pb-16">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn bg-t-secondary px-6 text-t-secondary-fg hover:brightness-110" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas: pattern-bordered chips ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="py-14 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} className="[&_h2]:uppercase" />
        {zones.length ? (
          <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
            {zones.map((z) => (
              <li key={z.id} className="overflow-hidden rounded-[var(--t-radius)] border-2 border-t-secondary bg-t-bg">
                <TruckArt />
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm">
                  <MapPin className="size-4 text-t-primary" />
                  <span className="font-bold uppercase">{z.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", z.fee === 0 ? "bg-t-secondary text-t-secondary-fg" : "bg-t-accent text-t-accent-fg")}>
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
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm font-semibold text-t-muted-fg">
            {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)} · {r.prepTimeMins} {t(rs.mins, lang)}
          </p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: pattern-framed panel ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="bg-t-muted py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[var(--t-radius)] bg-t-bg shadow-md">
          <TruckArt thick />
          <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-9">
            <div>
              <h2 className="font-heading text-3xl uppercase text-t-primary">{t(hs.title, lang)}</h2>
              <OpenBadge ctx={ctx} className="mt-4" />
              {c.phone ? (
                <a href={`tel:${c.phone}`} dir="ltr" className="font-heading mt-5 inline-flex items-center gap-2 text-2xl text-t-secondary">
                  <Phone className="size-5" /> {c.phone}
                </a>
              ) : null}
              {c.address ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-t-muted-fg">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" />
                  <span>
                    {c.address}
                    {c.city ? `, ${c.city}` : ""}
                  </span>
                </p>
              ) : null}
            </div>
            <HoursTable ctx={ctx} showStatus={false} />
          </div>
          <TruckArt thick />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  const urdu = ctx.lang === "ur";
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        deals: () => <Deals ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => (
          <ProcessBlock ctx={ctx} variant="steps" className="[&_h2]:uppercase [&_ol>li_span:first-child]:bg-t-accent [&_ol>li_span:first-child]:text-t-accent-fg" />
        ),
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted [&_h2]:uppercase [&_img]:border-4 [&_img]:border-t-accent" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} className="[&_button]:border-4 [&_button]:border-t-accent [&_h2]:uppercase" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => (
          <TestimonialsBlock
            ctx={ctx}
            variant="masonry"
            columns={3}
            className={cn("bg-t-muted [&_h2]:uppercase [&_p]:leading-loose", urdu && "[&_p]:font-urdu [&_p]:text-lg")}
          />
        ),
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className={cn("[&_h2]:uppercase", urdu && "[&_p]:font-urdu [&_p]:leading-loose")} />,
        cta: () => <CtaBlock ctx={ctx} variant="banner" className="[&_h2]:uppercase" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
