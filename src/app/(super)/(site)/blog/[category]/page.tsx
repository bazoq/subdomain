import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { db } from "@/server/db";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { getGuide } from "@/lib/guides";
import { templatesForCategory } from "@/templates/registry";
import { TemplateCard } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  const g = getGuide(c.key);
  return { title: g.title, description: g.intro };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export default async function CategoryBlogPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const guide = getGuide(c.key);
  const [posts, templates] = await Promise.all([
    db.blogPost.findMany({ where: { category: c.key, published: true }, orderBy: { publishedAt: "desc" } }).catch(() => []),
    Promise.resolve(templatesForCategory(c.key).slice(0, 3)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link href="/blog" className="hover:text-slate-900">
          Guides
        </Link>{" "}
        / <span className="text-slate-900">{c.name}</span>
      </nav>
      <div className="mt-6 grid gap-12 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{c.name} · Feature guide</p>
          <h1 className="font-heading mt-2 text-4xl font-bold leading-tight text-slate-900">{guide.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{guide.intro}</p>

          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/60 p-6">
            <h2 className="font-semibold text-slate-900">What every {c.name.toLowerCase()} template includes</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {guide.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-700">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {guide.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="font-heading text-2xl font-bold text-slate-900">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 leading-7 text-slate-600">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Frequently asked</h2>
            <dl className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {guide.faq.map((f) => (
                <div key={f.q} className="p-5">
                  <dt className="font-semibold text-slate-900">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {posts.length ? (
            <section className="mt-14">
              <h2 className="font-heading text-2xl font-bold text-slate-900">More articles for {c.plural.toLowerCase()}</h2>
              <ul className="mt-4 space-y-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/blog/${c.key}/${p.slug}`} className="block rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/40">
                      <p className="font-semibold text-slate-900">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.excerpt}</p>
                      <p className="mt-2 text-xs text-slate-400">{p.publishedAt ? formatDate(p.publishedAt) : ""}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">Templates for {c.plural.toLowerCase()}</h3>
            <div className="mt-4 space-y-4">
              {templates.map((t) => (
                <TemplateCard key={t.id} meta={t} categoryName={c.name} />
              ))}
            </div>
            <Link href={`/templates/${c.key}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              See all {c.templateCount} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">Get a {c.name.toLowerCase()} website</h3>
            <p className="mt-1 text-sm text-slate-500">Leave your number, we will call you.</p>
            <div className="mt-4">
              <LeadForm defaultCategory={c.key} compact />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
