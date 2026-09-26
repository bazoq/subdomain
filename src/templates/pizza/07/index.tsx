/**
 * pizza-07 "Crust & Co." (#907)
 * Minimal monochrome premium: white header with a tiny uppercase nav and a black order
 * button, a massive typographic hero whose last word carries the single red accent, the
 * menu preview as a stark price list, numbered deal blocks and square corners throughout.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Pizza, Plus } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { dealsSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Img, SectionHeading, WhatsAppFloat } from "@/templates/ui";
import { ls, t, ui, type LocalizedString } from "@/lib/i18n";
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
  zone: ls("Zone", "ایریا"),
  fee: ls("Fee", "فیس"),
};

/* ---------- signature: one accent word in a big headline ---------- */
function AccentHeadline({ value, lang, className }: { value: LocalizedString | undefined; lang: "en" | "ur"; className?: string }) {
  const text = t(value, lang).trim();
  if (!text) return null;
  const words = text.split(/\s+/);
  const last = words.length > 1 ? words[words.length - 1] : null;
  const head = last ? words.slice(0, -1).join(" ") : text;
  return (
    <h1 className={className}>
      {head}
      {last ? <span className="text-t-accent"> {last}</span> : null}
    </h1>
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
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: ui.orderNow, href: "/menu" }}
          className="[&_nav_a]:text-[11px] [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-[0.2em] [&_a>span.font-heading]:text-lg [&_a>span.font-heading]:uppercase [&_a>span.font-heading]:tracking-[0.2em]"
          rightSlot={
            <div className="flex items-center gap-3">
              {phone ? (
                <a href={`tel:${phone}`} dir="ltr" className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] md:inline-flex">
                  <Phone className="size-3.5" /> {phone}
                </a>
              ) : null}
              <CartCountLink host={ctx.host} label={t(ui.cart, lang)} className="border border-t-fg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] hover:bg-t-fg hover:text-t-bg" />
            </div>
          }
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" showHours />
        <CartBar ctx={rc} className="pe-24 sm:pe-4" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: type-first ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  return (
    <section className="border-b border-t-border">
      <Container className="py-16 lg:py-24">
        {h.eyebrow ? <span className="block text-[11px] font-semibold uppercase tracking-[0.35em] text-t-muted-fg">{h.eyebrow}</span> : null}
        <AccentHeadline value={h.title} lang={lang} className="font-heading t-fade-up mt-6 max-w-5xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="max-w-xl text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-8" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
              <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border border-t-fg px-8 text-t-fg hover:bg-t-muted" />
            </div>
            {h.badges?.length ? (
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
                {h.badges.map((b, i) => (
                  <li key={i} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-t-muted-fg">
                    {b.text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Img src={h.image} alt="" className="aspect-[4/3] w-full object-cover" fallback={<Pizza className="size-12 opacity-20" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Deals: numbered blocks ---------- */
function Deals({ ctx }: TemplatePageProps) {
  const d = section(ctx, dealsSection);
  if (!d || !d.items?.length) return null;
  const lang = ctx.lang;
  return (
    <section id="deals" className="border-b border-t-border py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} align="left" lang={lang} className="[&_h2]:text-3xl" />
        <ul className="grid gap-px bg-t-border sm:grid-cols-3">
          {d.items.map((it, i) => (
            <li key={i} className="flex flex-col bg-t-bg p-6 transition hover:bg-t-muted">
              <span className="font-heading text-5xl font-extrabold text-t-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-heading mt-4 text-xl font-bold uppercase tracking-tight">{t(it.title, lang)}</h3>
              <p className="mt-2 text-sm text-t-muted-fg">{t(it.description, lang)}</p>
              {it.badge ? <span className="mt-4 self-start border border-t-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-t-accent">{it.badge}</span> : null}
              <div className="mt-auto flex items-baseline justify-between gap-3 pt-6">
                <span className="font-heading text-2xl font-extrabold text-t-accent">{formatPKR(it.price)}</span>
                <Link href="/menu" className="text-[11px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4 hover:text-t-accent">
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

/* ---------- Featured menu: stark price list ---------- */
async function FeaturedMenu({ ctx }: TemplatePageProps) {
  const fm = section(ctx, featuredMenuSection);
  if (!fm) return null;
  const lang = ctx.lang;
  const items = await getFeaturedItems(ctx.tenant.id, fm.count || 6);
  if (!items.length) return null;
  return (
    <section id="menu" className="border-b border-t-border py-16 sm:py-20">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={fm.eyebrow} title={fm.title} align="left" lang={lang} className="mb-0 [&_h2]:text-3xl" />
          <CtaButton value={fm.cta} ctx={ctx} className="text-[11px] font-semibold uppercase tracking-[0.2em] underline underline-offset-4 hover:text-t-accent" />
        </div>
        <ul className="border-t border-t-border">
          {items.map((item, i) => {
            const name = t(item.name, lang);
            const desc = t(item.description, lang);
            return (
              <li key={item.id} className="group border-b border-t-border">
                <Link href={`/menu#item-${item.slug}`} className="flex items-start gap-4 py-5 sm:gap-8">
                  <span className="w-8 shrink-0 pt-1 text-xs font-semibold tabular-nums text-t-muted-fg">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-heading block text-xl font-bold uppercase tracking-tight group-hover:text-t-accent sm:text-2xl">{name}</span>
                    {desc ? <span className="mt-1 block max-w-2xl text-sm text-t-muted-fg">{desc}</span> : null}
                    <TagBadges tags={item.tags} lang={lang} className="mt-2" />
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="font-heading block text-xl font-extrabold tabular-nums sm:text-2xl">
                      {item.sizes.length > 1 ? <span className="me-1 text-[10px] font-normal uppercase tracking-[0.15em] text-t-muted-fg">{t(rs.from, lang)}</span> : null}
                      {formatPKR(itemStartingPrice(item))}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-t-muted-fg group-hover:text-t-fg">
                      <Plus className="size-3" /> {t(rs.add, lang)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Delivery areas: stark zone table ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  const r = ctx.settings.restaurant;
  return (
    <section id="delivery" className="border-b border-t-border bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading title={d.title} subtitle={d.text} align="left" lang={lang} className="[&_h2]:text-3xl" />
        {zones.length ? (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-t-border text-[10px] font-semibold uppercase tracking-[0.2em] text-t-muted-fg">
                <th className="py-3 text-start">{t(L.zone, lang)}</th>
                <th className="py-3 text-end">{t(L.fee, lang)}</th>
                <th className="hidden py-3 text-end sm:table-cell">{t(rs.minOrder, lang)}</th>
                <th className="py-3 text-end">{t(rs.eta, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-t-border">
                  <td className="py-3 font-semibold">{z.name}</td>
                  <td className={cn("py-3 text-end tabular-nums", z.fee === 0 && "font-semibold text-t-accent")}>{z.fee === 0 ? t(L.freeDelivery, lang) : formatPKR(z.fee)}</td>
                  <td className="hidden py-3 text-end tabular-nums text-t-muted-fg sm:table-cell">{z.minOrder > 0 ? formatPKR(z.minOrder) : "—"}</td>
                  <td className="py-3 text-end tabular-nums text-t-muted-fg">{z.etaMins ? `${z.etaMins} ${t(rs.mins, lang)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-t-muted-fg">
            {t(ui.deliveryFee, lang)} {formatPKR(r.defaultDeliveryFee)} · {r.prepTimeMins} {t(rs.mins, lang)}
          </p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: stark two-column band ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const hs = section(ctx, hoursSection);
  if (!hs) return null;
  const lang = ctx.lang;
  const c = ctx.settings.contact;
  return (
    <section id="hours" className="border-b border-t-border py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">{t(hs.title, lang)}</h2>
          <OpenBadge ctx={ctx} className="mt-5" />
          {c.address ? (
            <p className="mt-6 flex items-start gap-2 text-sm text-t-muted-fg">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>
                {c.address}
                {c.city ? `, ${c.city}` : ""}
              </span>
            </p>
          ) : null}
          {c.phone ? (
            <a href={`tel:${c.phone}`} dir="ltr" className="font-heading mt-4 inline-block text-3xl font-extrabold tracking-tight hover:text-t-accent">
              {c.phone}
            </a>
          ) : null}
        </div>
        <HoursTable ctx={ctx} showStatus={false} className="[&_td]:py-3 [&_td:first-child]:text-[11px] [&_td:first-child]:font-semibold [&_td:first-child]:uppercase [&_td:first-child]:tracking-[0.2em] [&_td:last-child]:tabular-nums" />
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
            variant="timeline"
            className="border-b border-t-border [&_ol]:border-t-fg/20 [&_ol>li>span:first-child]:rounded-none [&_ol>li>span:first-child]:bg-t-fg"
          />
        ),
        about: () => <AboutBlock ctx={ctx} variant="centered" className="border-b border-t-border bg-t-muted [&_img]:rounded-none" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={3} take={3} className="border-b border-t-border [&_button]:rounded-none [&_img]:aspect-square" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="single" className="border-b border-t-border bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" className="border-b border-t-border" />,
        cta: () => <CtaBlock ctx={ctx} variant="split" className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
