import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { db } from "@/server/db";
import { allGuides } from "@/lib/guides";
import { getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Feature guides & blog", description: "What each business type gets with its website, plus tips for selling online in Pakistan." };
export const dynamic = "force-dynamic";

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Store;
  return <Cmp className={className} />;
}

export default async function BlogIndex() {
  const posts = await db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 12 }).catch(() => []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Guides</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">A guide for every business type</h1>
        <p className="mt-3 text-slate-600">Each guide explains exactly what the templates in that category do, how orders or enquiries work, and how the admin panel manages it all.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allGuides().map(({ category: c, guide }) => (
          <Link key={c.key} href={`/blog/${c.key}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white">
              <CatIcon name={c.icon} className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-slate-500">{guide.title}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Read guide <ArrowRight className="size-4" />
            </span>
          </Link>
        ))}
      </div>

      {posts.length ? (
        <section className="mt-20">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Latest articles</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.category}/${p.slug}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-100 to-violet-100" />
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{getCategory(p.category)?.name ?? p.category}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-400">{p.publishedAt ? formatDate(p.publishedAt) : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
