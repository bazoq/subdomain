import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { db } from "@/server/db";
import { allGuides } from "@/lib/guides";
import { getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import { JsonLd, breadcrumbJsonLd, isMostlyUrdu, itemListJsonLd, pageMetadata, readingTime } from "@/components/super-site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Feature guides & blog",
  description: "What each business type gets with its website, how orders and enquiries work in Pakistan, and tips for selling online with cash on delivery.",
  path: "/blog",
});
export const dynamic = "force-dynamic";

/** Label for a blog category key; posts written in the super admin may use "general". */
function blogCategoryName(key: string): string {
  if (key === "general") return "General";
  return getCategory(key)?.name ?? key;
}

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>>)[name] ?? Icons.Store;
  return <Cmp className={className} aria-hidden />;
}

export default async function BlogIndex() {
  const posts = await db.blogPost
    .findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 12, select: { id: true, category: true, slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true, content: true } })
    .catch(() => []);
  const guides = allGuides();
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
          ]),
          itemListJsonLd(
            "Feature guides by business type",
            guides.map(({ category: c, guide }) => ({ name: guide.title, path: `/blog/${c.key}` })),
          ),
        ]}
      />
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Guides</p>
        <h1 className="font-display mt-2 text-5xl text-white">A guide for every business type</h1>
        <p className="mt-3 text-zinc-400">Each guide explains exactly what the templates in that category do, how orders or enquiries work, and how the admin panel manages it all.</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {guides.map(({ category: c, guide }) => (
          <li key={c.key}>
            <Link href={`/blog/${c.key}`} className="group block h-full rounded-2xl border border-white/10 bg-ink-850 p-5 transition hover:-translate-y-0.5 hover:border-gold-400/40 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300 group-hover:bg-gold-400 group-hover:text-ink-950">
                <CatIcon name={c.icon} className="size-5" />
              </span>
              <h2 className="mt-4 font-semibold text-white">{c.name}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-zinc-500">{guide.title}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-300">
                Read guide <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length ? (
        <section className="mt-20" aria-labelledby="latest-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="latest-title" className="font-display text-3xl text-white">
              Latest articles
            </h2>
            {posts.some((p) => p.category === "general") ? (
              <Link href="/blog/general" className="text-sm font-semibold text-gold-300 hover:underline">
                All general articles
              </Link>
            ) : null}
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const urdu = isMostlyUrdu(p.title + " " + p.excerpt);
              return (
                <li key={p.id}>
                  <Link href={`/blog/${p.category}/${p.slug}`} className="block h-full overflow-hidden rounded-2xl border border-white/10 bg-ink-850 transition hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
                    {p.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverUrl} alt={`Cover image for “${p.title}”`} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
                    ) : (
                      <div className="aspect-[16/9] w-full bg-gradient-to-br from-gold-400/20 to-violet-500/20" aria-hidden />
                    )}
                    <div className="p-5" dir={urdu ? "rtl" : undefined} lang={urdu ? "ur" : undefined}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-400" dir="ltr" lang="en">
                        {blogCategoryName(p.category)}
                      </p>
                      <h3 className={`mt-1 font-semibold text-white ${urdu ? "font-urdu leading-9" : ""}`}>{p.title}</h3>
                      <p className={`mt-1 line-clamp-2 text-sm text-zinc-500 ${urdu ? "font-urdu leading-8" : ""}`}>{p.excerpt}</p>
                      <p className="mt-3 text-xs text-zinc-500" dir="ltr" lang="en">
                        {p.publishedAt ? formatDate(p.publishedAt) : ""} · {readingTime(p.content).minutes} min read
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
