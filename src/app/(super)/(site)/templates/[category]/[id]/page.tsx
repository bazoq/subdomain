import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, Check, ChevronRight, ExternalLink, LayoutTemplate, Lock, MousePointer2, Palette, Type } from "lucide-react";
import { brand, entryPlan } from "@/config/brand";
import { getCategory } from "@/lib/categories";
import { formatPKR } from "@/lib/utils";
import { TEMPLATES } from "@/templates/registry";
import { galleryTemplatesForCategory, getGalleryTemplate } from "@/server/super/gallery";
import { BrowserFrame, PhoneFrame, TemplateCard, TemplateShot, demoHost, demoUrl, hasShot, templateHref, toCardData } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { ButtonLink, Container, Eyebrow, Glow, Panel } from "@/components/super-site/ui";
import { JsonLd, breadcrumbJsonLd, pageMetadata, templateProductJsonLd } from "@/components/super-site/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ category: string; id: string }> }): Promise<Metadata> {
  const { category, id } = await params;
  const t = await getGalleryTemplate(id);
  const c = getCategory(category);
  if (!t || !c || t.category !== c.key) return {};
  return pageMetadata({
    title: `${t.name} (#${t.code}) — ${c.name} website template`,
    description: `${t.tagline}. ${t.description}`,
    path: templateHref(t),
    image: `${templateHref(t)}/opengraph-image`,
    imageAlt: `${t.name} — ${c.name} website template #${t.code}`,
  });
}

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ category: t.category, id: t.id }));
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ category: string; id: string }> }) {
  const { category, id } = await params;
  const t = await getGalleryTemplate(id);
  const c = getCategory(category);
  if (!t || !c || t.category !== c.key) notFound();
  const related = (await galleryTemplatesForCategory(c.key)).filter((x) => x.id !== t.id).slice(0, 3);
  const card = toCardData(t);
  const demo = demoUrl(t.id);
  const offer = entryPlan();
  const palette: [string, string][] = [
    ["Primary", t.theme.colors.primary],
    ["Secondary", t.theme.colors.secondary],
    ["Accent", t.theme.colors.accent],
    ["Background", t.theme.colors.bg],
    ["Muted", t.theme.colors.muted],
  ];
  const showPhone = hasShot(t.id, "mobile");

  return (
    <div className="relative isolate">
      <Glow className="left-1/2 top-[-14rem] h-[32rem] w-[64rem] -translate-x-1/2" />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
            { name: c.name, path: `/templates/${c.key}` },
            { name: `${t.name} (#${t.code})`, path: templateHref(t) },
          ]),
          templateProductJsonLd(t, offer),
        ]}
      />
      <Container className="pb-24 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/templates" className="hover:text-zinc-200">
                Templates
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link href={`/templates/${c.key}`} className="hover:text-zinc-200">
                {c.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-zinc-200">
              {t.name}
            </li>
          </ol>
        </nav>

        {/* Title row */}
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <Eyebrow>
              {c.name} · <span className="font-mono normal-case tracking-normal">#{t.code}</span>
            </Eyebrow>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] tracking-tight text-white sm:text-7xl">{t.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-400">{t.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={demo} external>
              Open live demo <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </ButtonLink>
            <ButtonLink href="#order" variant="ghost">
              Order this template <ArrowDown className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        {/* Preview */}
        <div className="relative mt-12">
          <a href={demo} target="_blank" rel="noopener noreferrer" className="group block focus:outline-none" aria-label={`Open the live demo of ${t.name} in a new tab`}>
            <BrowserFrame host={demoHost(t.id)} className="shadow-[0_50px_140px_-40px_rgba(226,187,114,0.35)] transition group-focus-visible:ring-2 group-focus-visible:ring-gold-400">
              <TemplateShot meta={card} sizes="(min-width: 1280px) 1216px, 95vw" priority />
            </BrowserFrame>
            <span className="pointer-events-none absolute left-1/2 top-6 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-ink-950/80 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur transition group-hover:opacity-0 sm:inline-flex" aria-hidden>
              <MousePointer2 className="size-3.5 text-gold-400" /> Hover to scroll · click to open the demo
            </span>
          </a>
          {showPhone ? (
            <div className="group absolute -bottom-12 right-4 hidden w-44 md:block lg:right-10 lg:w-52" aria-hidden>
              <PhoneFrame>
                <TemplateShot meta={card} device="mobile" sizes="208px" autoplay />
              </PhoneFrame>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="mt-24 grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div>
              <h2 className="font-display text-4xl text-white">About this design</h2>
              <p className="mt-4 text-lg leading-8 text-zinc-400">{t.description}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Style">
                {t.style.map((s) => (
                  <li key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs capitalize text-zinc-300">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <Panel as="section" className="p-7" aria-labelledby="features-title">
              <h2 id="features-title" className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Features included
              </h2>
              <ul className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel as="section" className="p-7" aria-labelledby="sections-title">
              <h2 id="sections-title" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                <LayoutTemplate className="size-4 text-gold-400" aria-hidden /> {t.sections.length} editable sections
              </h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {t.sections.map((s) => (
                  <li key={s.key} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-400">
                    {s.label}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-zinc-500">Every section can be edited, reordered or switched off from the admin panel.</p>
            </Panel>
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <Panel className="p-7">
              <p className="text-sm text-zinc-400">From</p>
              <p className="font-display mt-1 text-5xl text-white">
                {formatPKR(offer.monthlyPrice)}
                <span className="font-sans text-base text-zinc-500"> / month</span>
              </p>
              <p className="mt-2 text-sm text-zinc-500">+ {formatPKR(offer.setupPrice)} one-time setup · hosting, SSL and support included</p>
              <div className="mt-6 grid gap-3">
                <ButtonLink href="#order">Order #{t.code}</ButtonLink>
                <ButtonLink href={`${demo}admin/login`} external variant="ghost">
                  <Lock className="size-4" aria-hidden /> Try the demo admin panel
                  <span className="sr-only">(opens in a new tab)</span>
                </ButtonLink>
              </div>
              <p className="mt-4 text-center text-xs text-zinc-500">
                Demo login: <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-300">{brand.demoLogin.username}</code> /{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-300">{brand.demoLogin.password}</code>
              </p>
              <Link href="/pricing" className="mt-4 block text-center text-sm font-semibold text-gold-300 hover:text-gold-200">
                Compare plans
              </Link>
            </Panel>
            <div className="grid grid-cols-2 gap-4">
              <Panel className="p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  <Palette className="size-3.5" aria-hidden /> Palette
                </p>
                <ul className="mt-4 flex -space-x-1.5">
                  {palette.map(([label, col]) => (
                    <li key={label}>
                      <span className="block size-8 rounded-full ring-2 ring-ink-850" style={{ background: col }} title={`${label}: ${col}`} />
                      <span className="sr-only">
                        {label} {col}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel className="p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  <Type className="size-3.5" aria-hidden /> Typography
                </p>
                <p className="mt-4 text-sm leading-6 text-zinc-200">
                  {t.theme.fonts.heading}
                  <br />
                  <span className="text-zinc-500">{t.theme.fonts.body}</span>
                </p>
              </Panel>
            </div>
          </aside>
        </div>

        {/* Order */}
        <Panel as="section" id="order" className="mt-20 grid scroll-mt-24 items-center gap-10 p-8 sm:p-12 lg:grid-cols-2" aria-labelledby="order-title">
          <div>
            <Eyebrow>Order</Eyebrow>
            <h2 id="order-title" className="font-display mt-4 text-4xl leading-tight text-white sm:text-5xl">
              Get “{t.name}” on your domain
            </h2>
            <p className="mt-4 text-zinc-400">Send your details. We connect template #{t.code} to your domain or a free subdomain, create your admin login and load your details.</p>
          </div>
          <LeadForm defaultCategory={c.key} compact source={`template:${t.code}`} defaultMessage={`I am interested in template #${t.code} (${t.name}).`} />
        </Panel>

        {related.length ? (
          <section className="mt-24" aria-labelledby="related-title">
            <div className="flex items-end justify-between gap-4">
              <h2 id="related-title" className="font-display text-4xl text-white">
                More {c.name.toLowerCase()} designs
              </h2>
              <Link href={`/templates/${c.key}`} className="shrink-0 text-sm font-semibold text-gold-300 hover:text-gold-200">
                View all →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <TemplateCard key={r.id} meta={toCardData(r)} categoryName={c.name} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
