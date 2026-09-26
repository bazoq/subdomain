/**
 * bakery-03 "Cake Studio" (#1203)
 * Bold designer-cake studio: black-on-white typography, hot-pink accents, a three-image hero
 * photo grid and the custom-cake request pushed forward as the site's main call to action.
 */
import { ArrowRight, Cake, Camera, MapPin, Timer } from "lucide-react";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection, hoursSection } from "@/templates/shared/sections";
import { customCakeSection, deliveryAreasSection, featuredMenuSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import { AboutBlock, AnnouncementBar, CtaBlock, FaqBlock, GalleryBlock, HoursTable, ProcessBlock, SiteFooter, SiteHeader, TestimonialsBlock } from "@/modules/shared/ui";
import { getDeliveryZones } from "@/modules/restaurant/queries";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { rs } from "@/modules/restaurant/strings";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CartBar } from "@/modules/restaurant/ui/cart-bar";
import { CartDrawer } from "@/modules/restaurant/ui/cart-drawer";
import { CartCountLink } from "@/modules/restaurant/ui/cart-count";
import { FeaturedItems } from "@/modules/restaurant/ui/featured-items";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="flex min-h-screen flex-col bg-t-bg text-t-fg">
        <AnnouncementBar ctx={ctx} variant="dark" />
        <SiteHeader
          ctx={ctx}
          variant="light"
          cta={{ label: { en: "Order custom cake", ur: "کسٹم کیک آرڈر کریں" }, href: "/custom-cake" }}
          rightSlot={<CartCountLink host={ctx.host} className="px-2 py-2 text-sm font-bold text-t-fg" />}
          className="border-b-2 border-t-fg bg-t-bg [&_a>span.font-heading]:text-2xl [&_a>span.font-heading]:font-black [&_a>span.font-heading]:uppercase [&_a>span.font-heading]:tracking-tighter [&_nav_a]:font-semibold [&_nav_a]:uppercase [&_nav_a]:tracking-wide"
        />
        <div className="flex-1">{children}</div>
        <SiteFooter ctx={ctx} variant="dark" />
        <CartBar ctx={rc} className="pb-20 sm:pb-6" />
        <CartDrawer ctx={rc} />
        <WhatsAppFloat ctx={ctx} />
      </div>
    </OrderProvider>
  );
}

/* ---------- Hero: oversized type + three-image cake grid ---------- */
function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const shots = [h.image, ...(h.slides ?? [])].filter(Boolean).slice(0, 3);
  while (shots.length < 3) shots.push("");
  return (
    <section className="bg-t-bg">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="t-fade-up">
          {h.eyebrow ? <span className="inline-block bg-t-primary px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-t-primary-fg">{h.eyebrow}</span> : null}
          <h1 className="font-heading mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tighter sm:text-6xl lg:text-7xl">{t(h.title, lang)}</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-t-muted-fg">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-primary px-7 py-3 text-base font-bold uppercase tracking-wide" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn border-2 border-t-fg bg-t-fg px-7 py-3 text-base font-bold uppercase tracking-wide text-t-bg hover:opacity-90" />
          </div>
          {h.badges?.length ? (
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {h.badges.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                  <span className="text-t-primary [&_svg]:size-4">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Img src={shots[0]} alt="" className="col-span-2 aspect-[16/10] w-full object-cover" fallback={<Cake className="size-12 text-t-primary/40" />} />
          <Img src={shots[1]} alt="" className="aspect-square w-full object-cover" fallback={<Camera className="size-9 text-t-primary/40" />} />
          <Img src={shots[2]} alt="" className="aspect-square w-full bg-t-muted object-cover" fallback={<Cake className="size-9 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Signature: custom-cake request as the main CTA ---------- */
function CustomCake({ ctx }: TemplatePageProps) {
  const d = section(ctx, customCakeSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <section id="custom-cake" className="bg-t-dark text-t-dark-fg">
      <Container className="grid items-stretch gap-0 lg:grid-cols-2">
        <div className="flex flex-col justify-center py-14 lg:py-20 lg:pe-14">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-t-primary">{t(rs.customCake, lang)}</span>
          <h2 className="font-heading mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tighter sm:text-5xl">{t(d.title, lang)}</h2>
          <p className="mt-6 max-w-lg text-lg text-t-dark-fg/70">{t(d.text, lang)}</p>
          <div className="mt-9">
            <CtaButton value={d.cta} ctx={ctx} className="t-btn t-btn-primary px-8 py-4 text-base font-black uppercase tracking-wide" icon={<ArrowRight className="size-5 rtl:rotate-180" />} />
          </div>
        </div>
        <div className="relative min-h-72 lg:min-h-[32rem]">
          <Img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" fallback={<Cake className="size-14 text-t-primary/40" />} />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Featured menu (module kit) + section CTA ---------- */
function FeaturedMenu({ ctx }: TemplatePageProps) {
  const d = section(ctx, featuredMenuSection);
  if (!d) return null;
  const lang = ctx.lang;
  return (
    <div id="menu" className="bg-t-bg">
      {d.eyebrow ? (
        <Container>
          <span className="block pt-14 text-xs font-black uppercase tracking-[0.3em] text-t-primary">{d.eyebrow}</span>
        </Container>
      ) : null}
      <FeaturedItems
        ctx={ctx}
        take={d.count || 6}
        title={t(d.title, lang)}
        layout="cards"
        className="pt-6 [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter"
      />
      <Container className="pb-14">
        <CtaButton value={d.cta} ctx={ctx} className="t-btn border-2 border-t-fg px-6 py-3 text-sm font-bold uppercase tracking-wide text-t-fg hover:bg-t-fg hover:text-t-bg" />
      </Container>
    </div>
  );
}

/* ---------- Delivery areas: bold tiles ---------- */
async function DeliveryAreas({ ctx }: TemplatePageProps) {
  const d = section(ctx, deliveryAreasSection);
  if (!d) return null;
  const zones = await getDeliveryZones(ctx.tenant.id);
  const lang = ctx.lang;
  return (
    <section id="delivery" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-t-primary">{t(rs.deliveringTo, lang)}</span>
          <h2 className="font-heading mt-3 text-3xl font-black uppercase tracking-tighter sm:text-4xl">{t(d.title, lang)}</h2>
          <p className="mt-4 text-t-muted-fg">{t(d.text, lang)}</p>
        </div>
        {zones.length ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <li key={z.id} className="border-2 border-t-fg bg-t-card p-5">
                <h3 className="font-heading flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                  <MapPin className="size-4 text-t-primary" /> {z.name}
                </h3>
                <p className="mt-3 text-sm text-t-muted-fg">
                  {t(ui.deliveryFee, lang)}: <strong className="text-t-primary">{z.fee ? formatPKR(z.fee) : t({ en: "Free", ur: "مفت" }, lang)}</strong>
                </p>
                {z.etaMins ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-t-muted-fg">
                    <Timer className="size-3.5" /> {z.etaMins} {t(rs.mins, lang)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 border-2 border-dashed border-t-fg/30 p-6 text-sm text-t-muted-fg">{ctx.settings.contact.address || ctx.settings.contact.city}</p>
        )}
      </Container>
    </section>
  );
}

/* ---------- Hours: black panel ---------- */
function Hours({ ctx }: TemplatePageProps) {
  const d = section(ctx, hoursSection);
  if (!d || !ctx.settings.hours.length) return null;
  return (
    <section id="hours" className="bg-t-dark py-14 text-t-dark-fg sm:py-16">
      <Container className="max-w-3xl">
        <HoursTable ctx={ctx} light title={t(d.title, ctx.lang)} className="[&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-tight" />
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
        customCake: () => <CustomCake ctx={ctx} />,
        featuredMenu: () => <FeaturedMenu ctx={ctx} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="[&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="masonry" columns={3} className="bg-t-bg [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
        deliveryAreas: () => <DeliveryAreas ctx={ctx} />,
        hours: () => <Hours ctx={ctx} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="masonry" columns={3} className="bg-t-muted [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
        faq: () => <FaqBlock ctx={ctx} variant="accordion" className="[&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" className="bg-t-bg [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tighter" />,
      })}
      <section className="border-t-2 border-t-fg bg-t-bg py-8">
        <Container className="flex flex-col items-center justify-between gap-3 text-sm font-bold uppercase tracking-wide sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <Cake className="size-4 text-t-primary" /> {t(rs.customCake, ctx.lang)}
          </span>
          <SmartLink href="/custom-cake" ctx={ctx} className="text-t-primary hover:underline">
            {t(ui.bookNow, ctx.lang)} <ArrowRight className="inline size-4 rtl:rotate-180" />
          </SmartLink>
        </Container>
      </section>
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
