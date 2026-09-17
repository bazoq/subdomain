import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, LayoutTemplate, Lock, Palette, Type } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { getTemplateMeta, TEMPLATES, templatesForCategory } from "@/templates/registry";
import { TemplateCard, TemplateMini, demoUrl } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";

export async function generateMetadata({ params }: { params: Promise<{ category: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = getTemplateMeta(id);
  if (!t) return {};
  return { title: `${t.name} — ${t.tagline}`, description: t.description };
}

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ category: t.category, id: t.id }));
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ category: string; id: string }> }) {
  const { category, id } = await params;
  const t = getTemplateMeta(id);
  const c = getCategory(category);
  if (!t || !c || t.category !== c.key) notFound();
  const related = templatesForCategory(c.key).filter((x) => x.id !== t.id).slice(0, 3);
  const demo = demoUrl(t.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link href="/templates" className="hover:text-slate-900">
          Templates
        </Link>{" "}
        /{" "}
        <Link href={`/templates/${c.key}`} className="hover:text-slate-900">
          {c.name}
        </Link>{" "}
        / <span className="text-slate-900">{t.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
            <TemplateMini meta={t} className="aspect-[16/10]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Open live demo <ExternalLink className="size-4" />
            </a>
            <a href={`${demo}admin/login`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              <Lock className="size-4" /> Demo admin panel
            </a>
            <span className="self-center text-xs text-slate-500">
              Demo login: <code className="rounded bg-slate-100 px-1">demo</code> / <code className="rounded bg-slate-100 px-1">demo1234</code>
            </span>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{c.name}</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">
            <span className="mr-2 align-middle rounded-md bg-slate-900 px-2 py-1 font-mono text-lg text-white">#{t.code}</span>
            {t.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">Template code {t.code} · quote this code when ordering</p>
          <p className="mt-2 text-lg text-slate-600">{t.tagline}</p>
          <p className="mt-4 text-slate-600">{t.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {t.style.map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Palette className="size-3.5" /> Palette
              </p>
              <div className="mt-2 flex gap-1.5">
                {[t.theme.colors.primary, t.theme.colors.secondary, t.theme.colors.accent, t.theme.colors.bg, t.theme.colors.muted].map((col, i) => (
                  <span key={i} className="size-6 rounded-full ring-1 ring-black/10" style={{ background: col }} title={col} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Type className="size-3.5" /> Typography
              </p>
              <p className="mt-2 text-slate-800">
                {t.theme.fonts.heading} <span className="text-slate-400">/</span> {t.theme.fonts.body}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">Features included</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <LayoutTemplate className="size-4" /> Editable sections ({t.sections.length})
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.sections.map((s) => (
                <span key={s.key} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                  {s.label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Every section can be edited, reordered or switched off from the admin panel.</p>
          </div>
        </div>
      </div>

      <section className="mt-16 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Get “{t.name}” (#{t.code}) on your domain</h2>
          <p className="mt-2 text-slate-600">Send your details. We connect the template to your domain or subdomain, create your admin login and load your details.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm defaultCategory={c.key} compact />
        </div>
      </section>

      {related.length ? (
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-slate-900">More {c.name.toLowerCase()} templates</h2>
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
