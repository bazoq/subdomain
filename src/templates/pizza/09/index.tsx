/**
 * pizza-09 "Slice Republic" (#909)
 * Modern multi-branch chain: red utility top bar (phone, today's hours, city) above a white
 * header, a scroll-snap two-slide hero with dot links, a branch + hours strip and icon tiles
 * beneath it, delivery zones presented as branch cards on a strict corporate grid.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Clock, MapPin, Phone, Pizza, Timer } from "lucide-react";
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
  branches: ls("Branches & zones", "برانچز اور ایریاز"),
  slide: ls("Slide", "سلائیڈ"),
  callBranch: ls("Call branch", "برانچ کو کال کریں"),
};

/* ---------- Layout: red utility bar + white corporate header ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).getDay();
  const today = ctx.settings.hours.find((x) => x.day === weekday);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <div className="bg-t-primary text-t-primary-fg">
          <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-xs font-semibold">
            <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {c.phone ? (
                <a href={`tel:${c.phone}`} dir="ltr" className="inline-flex items-center gap-1.5 hover:underline">
                  <Phone className="size-3.5" /> {c.phone}
                </a>
              ) : null}
              {c.city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {c.city}
                </span>
              ) : null}
            </span>
            {today ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {today.closed ? (
                  t(ui.closedNow, lang)
                ) : (
                  <span dir="ltr">
                    {today.open} – {today.close}
                  </span>
                )}
              </span>
            ) : null}
          </Container>
        </div>
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="[&_nav_a]:text-sm [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-wide"
          rightSlot={
            <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="rounded-[var(--t-radius)] border border-t-border px-3 py-1.5 text-sm font-semibold hover:bg-t-muted" />
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

/* ---------- Hero: scroll-snap slider + branch strip + icon tiles ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const deals = section(ctx, dealsSection);
  const zones = await getDeliveryZones(ctx.tenant.id);
  const images = [h.image, ...(h.slides ?? [])].filter(Boolean).slice(0, 4);
  const slides = images.length > 1 ? images : [h.image, h.image];
  const r = ctx.settings.restaurant;
  return (
    <>
      <section className="relative bg-t-dark text-t-dark-fg">
        <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
          {slides.map((src, i) => {
            const deal = i > 0 ? deals?.items?.[i - 1] : undefined;
            return (
              <div key={i} id={`slide-${i + 1}`} className="relative min-w-full snap-center">
                <Img src={src} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" fallback={<Pizza className="size-20 opacity-20" />} />
                <Container className="relative py-20 lg:py-28">
                  <div className="t-fade-up max-w-2xl">
                    {i === 0 ? (
                      <>
                        {h.eyebrow ? <span className="inline-flex bg-t-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-primary-fg">{h.eyebrow}</span> : null}
                        <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
                        <p className="mt-5 max-w-xl text-lg leading-8 text-t-dark-fg/85">{t(h.subtitle, lang)}</p>
                      </>
                    ) : (
                      <>
                        {deal?.badge ? <span className="inline-flex bg-t-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-t-accent-fg">{deal.badge}</span> : null}
                        <h2 className="font-heading mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl">{deal ? t(deal.title, lang) : t(h.title, lang)}</h2>
                        <p className="mt-5 max-w-xl text-lg leading-8 text-t-dark-fg/85">{deal ? t(deal.description, lang) : t(h.subtitle, lang)}</p>
                        {deal ? <p className="font-heading mt-4 text-3xl text-t-accent">{formatPKR(deal.price)}</p> : null}
                      </>
                    )}
                    <div className="mt-8 flex flex-wrap gap-3">
                      <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
                      <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border border-white/50 px-7 text-white hover:bg-white/10" />
                    </div>
                  </div>
                </Container>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {slides.map((_, i) => (
            <a
              key={i}
              href={`#slide-${i + 1}`}
              aria-label={`${t(L.slide, lang)} ${i + 1}`}
              className="size-2.5 rounded-full bg-white/50 transition hover:bg-t-primary focus-visible:bg-t-primary"
            />
          ))}
        </div>
      </section>
      {/* branch / hours strip */}
      <div className="border-b border-t-border bg-t-muted">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 text-sm">
          <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wide text-t-primary">
            <Building2 className="size-4" /> {t(L.branches, lang)}
          </span>
          <ul className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
            {zones.length ? (
              zones.slice(0, 6).map((z) => (
                <li key={z.id} className="inline-flex items-center gap-1.5 text-t-muted-fg">
                  <MapPin className="size-3.5 text-t-accent" />
                  <span className="font-semibold text-t-fg">{z.name}</span>
                  {z.etaMins ? (
                    <span className="text-xs">
                      {z.etaMins} {t(rs.mins, lang)}
                    </span>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="inline-flex items-center gap-1.5 text-t-muted-fg">
                <Timer className="size-3.5 text-t-accent" /> {r.prepTimeMins} {t(rs.mins, lang)}
              </li>
            )}
          </ul>
          <OpenBadge ctx={ctx} />
        </Container>
      </div>
      {/* four icon tiles */}
      {h.badges?.length ? (
        <Container className="grid gap-px border-b border-t-border bg-t-border sm:grid-cols-2 lg:grid-cols-4">
          {h.badges.map((b, i) => (
            <div key={i} className="flex items-center gap-3 bg-t-bg px-5 py-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--t-radius)] bg-t-primary/10 text-t-primary [&_svg]:size-5">
                <Icon name={b.icon} />
              </span>
              <span className="text-sm font-semibold">{b.text}</span>
            </div>
          ))}
        </Container>
      ) : null}
    </>
  );
}

/* ---------- Deals: equal-height corporate cards ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={lang} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="t-card flex flex-col overflow-hidden">
              <div className="relative">
                <Img src={it.image} alt="" className="aspect-[16/9] w-full object-cover" fallback={<Pizza className="size-10 opacity-25" />} />
                <span className="absolute bottom-0 end-0 bg-t-primary px-4 py-2 font-heading text-lg font-extrabold text-t-primary-fg">{formatPKR(it.price)}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                {it.badge ? <span className="self-start bg-t-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-t-accent-fg">{it.badge}</span> : null}
                <h3 className="font-heading mt-3 text-xl font-bold">{t(it.title, lang)}</h3>
                <p className="mt-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
                <Link href="/menu" className="t-btn t-btn-primary mt-auto w-full text-sm">
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

/* ---------- Featured menu (module kit, honouring the section) ---------- */
function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  return (
    <div id="menu" className="border-y border-t-border bg-t-muted">
      <FeaturedItems ctx={ctx} take={fm.count || 6} title={t(fm.title, lang) || undefined} className="[&_.t-card]:bg-t-bg" />
      <Container className="-mt-6 pb-12 text-center sm:-mt-8 sm:pb-16">
        <CtaButton value={fm.cta} ctx={ctx} className="t-btn t-btn-outline px-6 text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas as branch cards ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} lang={lang} />
        {zones.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <li key={z.id} className="t-card flex h-full flex-col p-6">
                <span className="flex size-11 items-center justify-center rounded-[var(--t-radius)] bg-t-primary text-t-primary-fg">
                  <Building2 className="size-5" />
                </span>
                <h3 className="font-heading mt-4 text-xl font-bold">{z.name}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3 border-b border-t-border pb-2">
                    <dt className="text-t-muted-fg">{t(ui.deliveryFee, lang)}</dt>
                    <dd className={cn("font-semibold", z.fee === 0 && "text-t-accent")}>{z.fee === 0 ? t(L.freeDelivery, lang) : formatPKR(z.fee)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-t-border pb-2">
                    <dt className="text-t-muted-fg">{t(rs.minOrder, lang)}</dt>
                    <dd className="font-semibold">{z.minOrder > 0 ? formatPKR(z.minOrder) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-t-muted-fg">{t(rs.eta, lang)}</dt>
                    <dd className="font-semibold">{z.etaMins ? `${z.etaMins} ${t(rs.mins, lang)}` : `${r.prepTimeMins} ${t(rs.mins, lang)}`}</dd>
                  </div>
                </dl>
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="t-btn t-btn-outline mt-5 w-full text-sm text-t-primary">
                    <Phone className="size-4" /> {t(L.callBranch, lang)}
                  </a>
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

/* ---------- Hours ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="border-y border-t-border bg-t-muted py-16 sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-2">
        <div className="t-card bg-t-bg p-6 sm:p-8">
          <HoursTable ctx={ctx} title={t(hs.title, lang)} />
        </div>
        <div className="t-card flex flex-col gap-4 bg-t-bg p-6 sm:p-8">
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
            <a href={`tel:${c.phone}`} dir="ltr" className="font-heading inline-flex items-center gap-2 text-2xl font-extrabold text-t-primary">
              <Phone className="size-5" /> {c.phone}
            </a>
          ) : null}
          <Link href="/menu" className="t-btn t-btn-primary mt-auto self-start px-6">
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
        process: () => <ProcessBlock ctx={ctx} variant="steps" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="border-y border-t-border bg-t-muted" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="grid" columns={3} />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-y border-t-border bg-t-muted" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
