import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { galleryTemplatesForCategory } from "@/server/super/gallery";
import { TemplateCard, templateHref } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/components/super-site/seo";
import { getGuide } from "@/lib/guides";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} website templates (${c.templateCount} designs)`,
    description: `${c.description} ${c.templateCount} ready templates for ${c.plural.toLowerCase()} in Pakistan, each with a live demo and admin panel.`,
    path: `/templates/${c.key}`,
  });
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export default async function CategoryTemplatesPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const list = await galleryTemplatesForCategory(c.key);
  const guide = getGuide(c.key);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
            { name: c.name, path: `/templates/${c.key}` },
          ]),
          itemListJsonLd(
            `${c.name} website templates`,
            list.map((t) => ({ name: `${t.name} (#${t.code})`, path: templateHref(t) })),
          ),
          faqJsonLd(guide.faq),
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/templates" className="hover:text-slate-900">
              All templates
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-slate-900">
            {c.name}
          </li>
        </ol>
      </nav>
      <div className="mt-4 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{c.plural}</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">{c.name} website templates</h1>
          <p className="mt-3 text-lg text-slate-600">{c.description}</p>
          <p className="mt-2 font-urdu text-base leading-8 text-slate-600" dir="rtl" lang="ur">
            {c.nameUr}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Template numbers for this category start at #{c.series + 1}. Quote the number when you contact us.
          </p>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="included-title">
          <h2 id="included-title" className="font-semibold text-slate-900">
            Included in every {c.name.toLowerCase()} template
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {guide.features.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link href={`/blog/${c.key}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Read the full feature guide <ArrowRight className="size-4" aria-hidden />
          </Link>
        </aside>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <TemplateCard key={t.id} meta={t} categoryName={c.name} />
        ))}
        {list.length === 0 ? <p className="rounded-xl border border-dashed p-10 text-center text-slate-500 sm:col-span-2 lg:col-span-3">Templates for this category are not published yet. Contact us and we will show you a preview.</p> : null}
      </div>

      <section className="mt-20 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2" aria-labelledby="want-title">
        <div>
          <h2 id="want-title" className="font-heading text-2xl font-bold text-slate-900">
            Want one of these for your {c.name.toLowerCase()}?
          </h2>
          <p className="mt-2 text-slate-600">Send us your details and the template number. We set it up on your domain and hand over the admin login.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm defaultCategory={c.key} compact source={`templates/${c.key}`} />
        </div>
      </section>
    </div>
  );
}
