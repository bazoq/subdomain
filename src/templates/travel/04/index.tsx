/**
 * travel-04 "JetSet" (#804)
 * Modern ticketing & visa, purple. White header with purple logo, pill nav and "Get a quote".
 * Gradient hero with a ticket-shaped search card (perforated edges via CSS mask) and a
 * badge/airline strip. Services as ticket-stub cards; packages as a snap carousel.
 * Rounded-xl, gradients, ticket motifs.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Plane, Ticket } from "lucide-react";
import type { Service } from "@/generated/prisma/client";
import type { TemplateComponents, TemplateLayoutProps, TemplatePageProps } from "@/templates/types";
import { section } from "@/templates/types";
import { heroSection } from "@/templates/shared/sections";
import { destinationsSection, featuredPackagesSection, umrahSection } from "@/templates/shared/packs";
import { renderOrdered } from "@/templates/shared/render";
import { Container, CtaButton, Icon, Img, SectionHeading, SmartLink, WhatsAppFloat } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getServices } from "@/modules/shared/queries";
import { asLocalizedList } from "@/modules/shared/content-types";
import type { HeadingData } from "@/modules/shared/ui/section-types";
import {
  AboutBlock,
  AnnouncementBar,
  ContactBlock,
  CtaBlock,
  FaqBlock,
  FeaturesBlock,
  GalleryBlock,
  ProcessBlock,
  SiteFooter,
  SiteHeader,
  StatsBlock,
  TestimonialsBlock,
  servicePriceLabel,
} from "@/modules/shared/ui";
import { PackageCard, PackageSearch, UmrahHighlights } from "@/modules/travel/ui";
import { getDestinations, getFeaturedPackages } from "@/modules/travel/queries";

/* ---------- Layout ---------- */
function Layout({ ctx, children }: TemplateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-t-bg">
      <AnnouncementBar ctx={ctx} variant="primary" />
      <SiteHeader
        ctx={ctx}
        variant="light"
        cta={{ label: ui.getQuote, href: "/contact" }}
        className="[&_a>span.font-heading]:text-t-primary [&_nav>a]:rounded-full [&_nav>a]:px-4 [&_nav>a[aria-current=page]]:bg-t-muted [&_a.t-btn]:rounded-full"
      />
      <div className="flex-1">{children}</div>
      <SiteFooter ctx={ctx} variant="dark" />
      <WhatsAppFloat ctx={ctx} />
    </div>
  );
}

/* ---------- Ticket shell: perforated edges via CSS mask ---------- */
const TICKET_MASK =
  "radial-gradient(circle at 0 50%, transparent 13px, #000 14px), radial-gradient(circle at 100% 50%, transparent 13px, #000 14px)";

function TicketShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-t-card text-t-fg shadow-2xl", className)} style={{ WebkitMaskImage: TICKET_MASK, maskImage: TICKET_MASK, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}>
      {children}
    </div>
  );
}

/* ---------- Hero ---------- */
async function Hero({ ctx }: TemplatePageProps) {
  const h = section(ctx, heroSection);
  if (!h) return null;
  const lang = ctx.lang;
  const dests = (await getDestinations(ctx.tenant.id)).map((d) => d.destination);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-t-primary via-t-primary to-t-secondary text-t-primary-fg">
      <div className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-t-accent/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -start-24 bottom-0 size-80 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div className="t-fade-up">
          {h.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
              <Plane className="size-3.5" /> {h.eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{t(h.title, lang)}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-t-primary-fg/85">{t(h.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton value={h.primaryCta} ctx={ctx} className="t-btn t-btn-accent rounded-full" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
            <CtaButton value={h.secondaryCta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary-fg" />
          </div>
        </div>
        <div className="relative">
          <Img src={h.image} alt="" className="aspect-[4/3] w-full rounded-[var(--t-radius)] object-cover shadow-2xl ring-4 ring-white/20" fallback={<Plane className="size-16 opacity-40" />} />
        </div>
      </Container>
      {/* ticket-shaped search card */}
      <Container className="relative pb-6">
        <TicketShell className="flex flex-col sm:flex-row">
          <div className="flex items-center gap-3 border-b border-dashed border-t-border px-6 py-4 sm:w-44 sm:shrink-0 sm:border-b-0 sm:border-e">
            <TicketIcon />
            <div className="text-xs font-bold uppercase tracking-widest text-t-muted-fg">
              <span className="block text-t-primary">{lang === "ur" ? "بورڈنگ پاس" : "Boarding pass"}</span>
              {t(ui.search, lang)}
            </div>
          </div>
          <div className="flex-1 p-4">
            <PackageSearch ctx={ctx} destinations={dests} variant="plain" className="max-w-none [&_button]:rounded-full" />
          </div>
        </TicketShell>
      </Container>
      {/* badge / airline strip */}
      {h.badges?.length ? (
        <div className="relative border-t border-white/15 bg-t-secondary/40 backdrop-blur">
          <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-sm font-semibold uppercase tracking-widest text-t-primary-fg/85">
            {h.badges.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                <Icon name={b.icon} className="size-4 text-t-accent" /> {b.text}
              </span>
            ))}
          </Container>
        </div>
      ) : null}
    </section>
  );
}

function TicketIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-t-primary/10 text-t-primary">
      <Ticket className="size-5" />
    </span>
  );
}

/* ---------- Signature: services as ticket stubs ---------- */
function StubCard({ s, ctx }: { s: Service; ctx: TemplatePageProps["ctx"] }) {
  const lang = ctx.lang;
  const feats = asLocalizedList(s.features).slice(0, 3);
  const price = servicePriceLabel(s, lang);
  return (
    <Link href={`/services/${s.slug}`} className="group block">
      <TicketShell className="flex h-full flex-col border border-t-border transition group-hover:shadow-xl sm:flex-row">
        <div className="flex items-center justify-center bg-t-primary p-4 text-t-primary-fg sm:w-20 sm:shrink-0 [&_svg]:size-7">
          <Icon name={s.icon ?? undefined} />
        </div>
        <div className="flex flex-1 flex-col border-t border-dashed border-t-border p-5 sm:border-s sm:border-t-0">
          <h3 className="font-heading text-lg font-bold group-hover:text-t-primary">{t(s.name as LocalizedString, lang)}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-t-muted-fg">{t(s.summary as LocalizedString, lang)}</p>
          {feats.length ? (
            <ul className="mt-3 space-y-1 text-xs text-t-muted-fg">
              {feats.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="size-3 text-t-accent" /> {t(f, lang)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-t-primary">
            <span>{price || t(ui.readMore, lang)}</span>
            <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180" />
          </div>
        </div>
      </TicketShell>
    </Link>
  );
}

async function Services({ ctx }: TemplatePageProps) {
  const h = ctx.sections.services?.data as HeadingData | undefined;
  const rows = await getServices(ctx.tenant.id, { take: 6 });
  if (!rows.length) return null;
  return (
    <section id="services" className="bg-t-muted py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={h?.eyebrow} title={h?.title ?? ui.services} subtitle={h?.subtitle} lang={ctx.lang} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <StubCard key={s.id} s={s} ctx={ctx} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Packages: snap carousel ---------- */
async function Packages({ ctx }: TemplatePageProps) {
  const fp = section(ctx, featuredPackagesSection);
  if (!fp) return null;
  const items = await getFeaturedPackages(ctx.tenant.id, fp.count || 6);
  if (!items.length) return null;
  return (
    <section id="packages" className="overflow-hidden py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={fp.eyebrow} title={fp.title} align="left" lang={ctx.lang} className="mb-0" />
          <CtaButton value={fp.cta} ctx={ctx} className="t-btn t-btn-outline rounded-full text-t-primary" icon={<ArrowRight className="size-4 rtl:rotate-180" />} />
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {items.map((p) => (
            <PackageCard key={p.id} pkg={p} ctx={ctx} className="w-[82%] shrink-0 snap-start sm:w-80" />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Destinations: pill grid ---------- */
function Destinations({ ctx }: TemplatePageProps) {
  const d = section(ctx, destinationsSection);
  if (!d || !d.items?.length) return null;
  return (
    <section id="destinations" className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={d.eyebrow} title={d.title} lang={ctx.lang} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.items.map((it, i) => (
            <li key={i}>
              <SmartLink href={it.href || "/packages"} ctx={ctx} className="group flex items-center gap-4 rounded-full border border-t-border bg-t-card p-2 pe-5 transition hover:border-t-primary hover:shadow-md">
                <Img src={it.image} alt="" className="size-16 shrink-0 rounded-full object-cover" />
                <span className="min-w-0">
                  <span className="font-heading block truncate font-bold group-hover:text-t-primary">{t(it.name, ctx.lang)}</span>
                  {it.note ? <span className="block truncate text-xs text-t-muted-fg">{it.note}</span> : null}
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Umrah: gradient ticket ---------- */
function Umrah({ ctx }: TemplatePageProps) {
  const u = section(ctx, umrahSection);
  if (!u) return null;
  const lang = ctx.lang;
  return (
    <section id="umrah" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-8 overflow-hidden rounded-[var(--t-radius)] bg-gradient-to-r from-t-secondary to-t-primary text-t-primary-fg lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">{t(u.title, lang)}</h2>
            <p className="mt-4 text-t-primary-fg/85">{t(u.text, lang)}</p>
            {u.points?.length ? (
              <ul className="mt-6 space-y-2">
                {u.points.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-t-accent" /> {t(p.text, lang)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <CtaButton value={u.cta} ctx={ctx} className="t-btn t-btn-accent rounded-full" />
            </div>
          </div>
          <Img src={u.image} alt="" className="min-h-64 w-full object-cover" fallback={<Icon name="Moon" className="size-14 opacity-40" />} />
        </div>
      </Container>
      <UmrahHighlights ctx={ctx} showPackages={false} className="pb-0 pt-14 sm:pb-0" />
    </section>
  );
}

/* ---------- Home ---------- */
function Home({ ctx }: TemplatePageProps) {
  return (
    <>
      <Hero ctx={ctx} />
      {renderOrdered(ctx, {
        featuredPackages: () => <Packages ctx={ctx} />,
        destinations: () => <Destinations ctx={ctx} />,
        umrah: () => <Umrah ctx={ctx} />,
        services: () => <Services ctx={ctx} />,
        features: () => <FeaturesBlock ctx={ctx} variant="grid" columns={4} />,
        process: () => <ProcessBlock ctx={ctx} variant="steps" className="bg-t-muted" />,
        stats: () => <StatsBlock ctx={ctx} variant="cards" />,
        about: () => <AboutBlock ctx={ctx} variant="split" className="bg-t-muted" />,
        gallery: () => <GalleryBlock ctx={ctx} variant="grid" columns={4} />,
        testimonials: () => <TestimonialsBlock ctx={ctx} variant="carousel" className="bg-t-muted" />,
        faq: () => <FaqBlock ctx={ctx} variant="two-column" />,
        cta: () => <CtaBlock ctx={ctx} variant="card" />,
        contact: () => <ContactBlock ctx={ctx} layout="split" formKey="contact" subjectOptions={["Air ticket", "Visa", "Package", "Hotel", "Other"]} className="bg-t-muted" />,
      })}
    </>
  );
}

export const components: TemplateComponents = { Layout, Home };
