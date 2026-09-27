import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, LayoutTemplate, Lock, Palette, Type } from "lucide-react";
import { entryPlan } from "@/config/brand";
import { getCategory } from "@/lib/categories";
import { formatPKR } from "@/lib/utils";
import { TEMPLATES } from "@/templates/registry";
import { galleryTemplatesForCategory, getGalleryTemplate } from "@/server/super/gallery";
import { TemplateCard, TemplateMini, demoUrl, templateHref } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
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
  const demo = demoUrl(t.id);
  const offer = entryPlan();
  const palette: [string, string][] = [
    ["Primary", t.theme.colors.primary],
    ["Secondary", t.theme.colors.secondary],
    ["Accent", t.theme.colors.accent],
    ["Background", t.theme.colors.bg],
    ["Muted", t.theme.colors.muted],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
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
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/templates" className="hover:text-slate-900">
              Templates
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/templates/${c.key}`} className="hover:text-slate-900">
              {c.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-slate-900">
            {t.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl" role="img" aria-label={`Preview of the ${t.name} template: ${t.tagline}`}>
            <TemplateMini meta={t} className="aspect-[16/10]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Open live demo <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a href={`${demo}admin/login`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              <Lock className="size-4" aria-hidden /> Demo admin panel
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <span className="self-center text-xs text-slate-500">
              Demo login: <code className="rounded bg-slate-100 px-1">demo</code> / <code className="rounded bg-slate-100 px-1">demo1234</code>
            </span>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{c.name}</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">
            <span className="mr-2 rounded-md bg-slate-900 px-2 py-1 align-middle font-mono text-lg text-white">
              <span className="sr-only">Template code </span>#{t.code}
            </span>
            {t.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">Template code {t.code} · quote this code when ordering</p>
          <p className="mt-2 text-lg text-slate-600">{t.tagline}</p>
          <p className="mt-4 text-slate-600">{t.description}</p>
          <p className="mt-3 text-sm text-slate-500">
            From <strong className="text-slate-900">{formatPKR(offer.monthlyPrice)}</strong> / month + {formatPKR(offer.setupPrice)} one-time setup.{" "}
            <Link href="/pricing" className="font-semibold text-brand-700 hover:underline">
              See pricing
            </Link>
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Style">
            {t.style.map((s) => (
              <li key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Palette className="size-3.5" aria-hidden /> Palette
              </p>
              <ul className="mt-2 flex gap-1.5">
                {palette.map(([label, col]) => (
                  <li key={label}>
                    <span className="block size-6 rounded-full ring-1 ring-black/10" style={{ background: col }} title={`${label}: ${col}`} />
                    <span className="sr-only">
                      {label} {col}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Type className="size-3.5" aria-hidden /> Typography
              </p>
              <p className="mt-2 text-slate-800">
                {t.theme.fonts.heading} <span className="text-slate-400">/</span> {t.theme.fonts.body}
              </p>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="features-title">
            <h2 id="features-title" className="font-semibold text-slate-900">
              Features included
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 p-5" aria-labelledby="sections-title">
            <h2 id="sections-title" className="flex items-center gap-2 font-semibold text-slate-900">
              <LayoutTemplate className="size-4" aria-hidden /> Editable sections ({t.sections.length})
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {t.sections.map((s) => (
                <li key={s.key} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                  {s.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Every section can be edited, reordered or switched off from the admin panel.</p>
          </section>
        </div>
      </div>

      <section className="mt-16 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2" aria-labelledby="order-title">
        <div>
          <h2 id="order-title" className="font-heading text-2xl font-bold text-slate-900">
            Get “{t.name}” (#{t.code}) on your domain
          </h2>
          <p className="mt-2 text-slate-600">Send your details. We connect the template to your domain or subdomain, create your admin login and load your details.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm defaultCategory={c.key} compact source={`template:${t.code}`} defaultMessage={`I am interested in template #${t.code} (${t.name}).`} />
        </div>
      </section>

      {related.length ? (
        <section className="mt-16" aria-labelledby="related-title">
          <h2 id="related-title" className="font-heading text-2xl font-bold text-slate-900">
            More {c.name.toLowerCase()} templates
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <TemplateCard key={r.id} meta={r} categoryName={c.name} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
