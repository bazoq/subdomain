import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { templatesForCategory } from "@/templates/registry";
import { TemplateCard } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { getGuide } from "@/lib/guides";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  return { title: `${c.name} website templates`, description: c.description };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export default async function CategoryTemplatesPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const list = templatesForCategory(c.key);
  const guide = getGuide(c.key);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900">
        ← All templates
      </Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{c.plural}</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">{c.name} website templates</h1>
          <p className="mt-3 text-lg text-slate-600">{c.description}</p>
          <p className="mt-2 font-urdu text-base leading-8 text-slate-600" dir="rtl">
            {c.nameUr}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-900">Included in every {c.name.toLowerCase()} template</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {guide.features.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
          <Link href={`/blog/${c.key}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Read the full feature guide <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <TemplateCard key={t.id} meta={t} categoryName={c.name} />
        ))}
        {list.length === 0 ? <p className="rounded-xl border border-dashed p-10 text-center text-slate-500">Templates for this category are being generated.</p> : null}
      </div>

      <section className="mt-20 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Want one of these for your {c.name.toLowerCase()}?</h2>
          <p className="mt-2 text-slate-600">Send us your details and the template name. We set it up on your domain and hand over the admin login.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm defaultCategory={c.key} compact />
        </div>
      </section>
    </div>
  );
}
