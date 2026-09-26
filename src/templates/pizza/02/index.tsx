/**
 * pizza-02 "Brick Oven" (#902)
 * Artisan wood-fired pizzeria, dark & rustic: transparent serif header over a full-screen
 * oven-fire hero, ember-orange CTAs, deals as ember-numbered rows, featured menu as large
 * image cards with the price on an ember badge, about as a "wood-fired since" timeline,
 * wood-grain dividers and square corners.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Flame, MapPin, Phone, Pizza, Plus, Timer, Utensils } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { aboutSection, heroSection, hoursSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, RichText, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
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
  woodFired: ls("Wood-fired", "لکڑی کے تندور سے"),
  ourStory: ls("Our story", "ہماری کہانی"),
};

/* ---------- signature: wood-grain divider ---------- */
function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-6 w-full", className)}
      style={{
        backgroundColor: "var(--t-dark)",
        backgroundImage:
          "repeating-linear-gradient(90deg, var(--t-border) 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, var(--t-primary) 0 2px, transparent 2px 57px)",
      }}
    />
  );
}

/* ---------- Layout: transparent header over the fire hero ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const phone = ctx.settings.contact.phone;
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <div className="relative flex flex-1 flex-col">
          <SiteHeader
            ctx={ctx}
            variant="transparent"
            cta={{ label: ui.orderNow, href: "/menu" }}
            className="[&_nav_a]:font-heading [&_nav_a]:text-base [&_nav_a]:tracking-wide [&_.t-btn]:rounded-none"
            rightSlot={
              <div className="flex items-center gap-2">
                <OpenBadge ctx={ctx} showHours={false} className="hidden xl:flex" />
                {phone ? (
                  <a href={`tel:${phone}`} dir="ltr" className="hidden items-center gap-1.5 text-sm font-semibold md:inline-flex">
                    <Phone className="size-4" /> {phone}
                  </a>
                ) : null}
                <CartCountLink host={ctx.host} label={t(rs.yourOrder, ctx.lang)} className="bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20" />
              </div>
            }
          />
          {/* pages get room for the absolute header; the home hero pulls itself back under it */}
          <div className="flex-1 pt-16 lg:pt-20">{children}</div>
        </div>
        <Grain />
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: full-screen oven fire ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="relative -mt-16 flex min-h-[90svh] items-end overflow-hidden lg:-mt-20">
      <Img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Flame className="size-24 opacity-20" />} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/80 to-t-bg/30" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-t-bg to-transparent" />
      <Container className="relative py-20 lg:py-28">
        <div className="t-fade-up max-w-3xl">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 border border-t-primary/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-t-primary">
              <Flame className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-6 text-4xl font-bold leading-[1.05] text-t-fg sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <span aria-hidden="true" className="mt-6 block h-px w-32 bg-t-primary" />
          <p className="mt-6 max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary rounded-none px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn rounded-none border border-t-fg/40 px-7 text-t-fg hover:bg-white/10" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-t-muted-fg">
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

/* ---------- Deals: ember-numbered rows ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={lang} />
        <ul className="divide-y divide-t-border border-y border-t-border">
          {d.items.map((it, i) => (
            <li key={i} className="group grid gap-5 py-7 sm:grid-cols-[auto_8rem_1fr_auto] sm:items-center">
              <span className="font-heading text-2xl text-t-primary/70">{String(i + 1).padStart(2, "0")}</span>
              <Img src={it.image} alt="" className="hidden aspect-square w-32 object-cover sm:block" fallback={<Pizza className="size-8 opacity-30" />} />
              <div>
                {it.badge ? <span className="inline-block bg-t-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-t-accent-fg">{it.badge}</span> : null}
                <h3 className="font-heading mt-2 text-2xl">{t(it.title, lang)}</h3>
                <p className="mt-1 max-w-xl text-sm text-t-muted-fg">{t(it.description, lang)}</p>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <span className="bg-t-primary px-3 py-1.5 font-heading text-xl text-t-primary-fg">{formatPKR(it.price)}</span>
                <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-t-primary hover:underline">
                  {t(ui.orderNow, lang)} <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Featured menu: large image cards, price on an ember badge ---------- */
async function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  const items = await getFeaturedItems(ctx.tenant.id, fm.count || 6);
  if (!items.length) return null;
  return (
    <section id="menu" className="py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={fm.eyebrow} title={fm.title} align="left" lang={lang} className="mb-0" />
          <CtaButton value={fm.cta} ctx={ctx} className="t-btn rounded-none border border-t-primary px-5 text-t-primary hover:bg-t-primary hover:text-t-primary-fg" />
        </div>
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((item) => {
            const name = t(item.name, lang);
            return (
              <li key={item.id} className="group relative overflow-hidden border border-t-border bg-t-card">
                <Link href={`/menu#item-${item.slug}`} className="block aspect-[16/10] overflow-hidden">
                  <Img src={item.imageUrl ?? ""} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallback={<Utensils className="size-10 opacity-30" />} />
                </Link>
                <span className="absolute end-0 top-6 flex items-baseline gap-1 bg-t-primary px-4 py-2 font-heading text-xl text-t-primary-fg">
                  {item.sizes.length > 1 ? <span className="text-[10px] font-normal uppercase tracking-wider opacity-80">{t(rs.from, lang)}</span> : null}
                  {formatPKR(itemStartingPrice(item))}
                </span>
                <div className="p-6">
                  <TagBadges tags={item.tags} lang={lang} className="mb-3" />
                  <h3 className="font-heading text-2xl">{name}</h3>
                  {t(item.description, lang) ? <p className="mt-2 line-clamp-2 text-sm text-t-muted-fg">{t(item.description, lang)}</p> : null}
                  <Link href={`/menu#item-${item.slug}`} className="t-btn t-btn-primary mt-5 h-9 rounded-none px-4 text-sm" aria-label={`${t(rs.add, lang)} ${name}`}>
                    <Plus className="size-4" /> {t(rs.add, lang)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- About: "wood-fired since" timeline ---------- */
function About({ ctx }: TemplatePageProps) {
  const a = section(ctx, aboutSection);
  if (!a) return null;
  const lang = ctx.lang;
  return (
    <section id="about" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <Img src={a.image} alt="" className="aspect-[4/5] w-full object-cover" fallback={<Flame className="size-16 opacity-25" />} />
          <span className="absolute -bottom-4 -end-4 hidden bg-t-primary px-5 py-3 font-heading text-lg text-t-primary-fg lg:block">{t(L.woodFired, lang)}</span>
        </div>
        <div>
          <span className="t-eyebrow">{a.eyebrow || t(L.ourStory, lang)}</span>
          <h2 className="font-heading mt-2 text-3xl sm:text-4xl">{t(a.title, lang)}</h2>
          <RichText value={a.body} lang={lang} className="mt-4 text-t-muted-fg" />
          {a.highlights?.length ? (
            <ol className="mt-8 space-y-6 border-s border-t-primary/40 ps-8">
              {a.highlights.map((hl, i) => (
                <li key={i} className="relative">
                  <span className="absolute -start-[2.3rem] top-0 flex size-8 items-center justify-center bg-t-primary text-t-primary-fg [&_svg]:size-4">
                    <Icon name={hl.icon} />
                  </span>
                  <p className="font-heading text-lg">{t(hl.text, lang)}</p>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-8">
            <CtaButton value={a.cta} ctx={ctx} className="t-btn t-btn-primary rounded-none px-6" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: ember-bordered zone cards ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  const chip = "inline-flex items-center gap-1 border border-t-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-t-muted-fg";
  return (
    <section id="delivery" className="py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} align="left" lang={lang} />
        {zones.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <li key={z.id} className="border border-t-border bg-t-card p-5 transition hover:border-t-primary">
                <h3 className="font-heading flex items-center gap-2 text-xl">
                  <MapPin className="size-4 text-t-primary" /> {z.name}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn(chip, z.fee === 0 && "border-t-primary text-t-primary")}>
                    {z.fee === 0 ? t(L.freeDelivery, lang) : `${t(ui.deliveryFee, lang)} ${formatPKR(z.fee)}`}
                  </span>
                  {z.minOrder > 0 ? (
                    <span className={chip}>
                      {t(rs.minOrder, lang)} {formatPKR(z.minOrder)}
                    </span>
                  ) : null}
                  {z.etaMins ? (
                    <span className={chip}>
                      <Timer className="size-3" /> {z.etaMins} {t(rs.mins, lang)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className={chip}>
              {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)}
            </span>
            {r.minDeliveryOrder > 0 ? (
              <span className={chip}>
                {t(rs.minOrder, lang)} {formatPKR(r.minDeliveryOrder)}
              </span>
            ) : null}
            <span className={chip}>
              <Timer className="size-3" /> {r.prepTimeMins} {t(rs.mins, lang)}
            </span>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: oven-door panel ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <span className="t-eyebrow inline-flex items-center gap-2">
            <Clock className="size-4" /> {t(ui.openNow, lang)}
          </span>
          <h2 className="font-heading mt-2 text-3xl sm:text-4xl">{t(hs.title, lang)}</h2>
          <OpenBadge ctx={ctx} className="mt-5" />
          {c.address ? (
            <p className="mt-6 flex items-start gap-2 text-sm text-t-muted-fg">
              <MapPin className="mt-0.5 size-4 shrink-0 text-t-primary" />
              <span>
                {c.address}
                {c.city ? `, ${c.city}` : ""}
              </span>
            </p>
          ) : null}
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="font-heading mt-3 inline-flex items-center gap-2 text-2xl text-t-primary">
              <Phone className="size-5" /> {c.phone}
            </a>
          ) : null}
        </div>
        <div className="border border-t-border bg-t-card p-6 sm:p-8">
          <HoursTable ctx={ctx} showStatus={false} className="[&_td]:py-3" />
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
        process: () => <ProcessBlock ctx={ctx} variant="timeline" className="border-y border-t-border" />,
        about: () => <About ctx={ctx} />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-y border-t-border bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
