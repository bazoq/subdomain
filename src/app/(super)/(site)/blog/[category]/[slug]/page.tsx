import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { db } from "@/server/db";
import { getCategory } from "@/lib/categories";
import { markdownToText, renderMarkdown } from "@/server/super/markdown";
import { formatDate } from "@/lib/utils";
import { LeadForm } from "@/components/super-site/lead-form";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, isMostlyUrdu, pageMetadata, readingTime } from "@/components/super-site/seo";

export const dynamic = "force-dynamic";

function categoryName(key: string) {
  return key === "general" ? "Articles" : (getCategory(key)?.name ?? key);
}

async function getPost(category: string, slug: string) {
  return db.blogPost.findFirst({ where: { category, slug, published: true } }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const p = await getPost(category, slug);
  if (!p) return {};
  return pageMetadata({
    title: p.title,
    description: p.excerpt || markdownToText(p.content, 160),
    path: `/blog/${p.category}/${p.slug}`,
    image: p.coverUrl,
    imageAlt: p.title,
    type: "article",
    publishedTime: p.publishedAt?.toISOString(),
    modifiedTime: p.updatedAt.toISOString(),
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const p = await getPost(category, slug);
  if (!p) notFound();
  const c = getCategory(category);
  const path = `/blog/${p.category}/${p.slug}`;
  const rt = readingTime(markdownToText(p.content, Number.MAX_SAFE_INTEGER));
  const urdu = isMostlyUrdu(p.title + " " + p.excerpt + " " + p.content.slice(0, 2000));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: categoryName(category), path: `/blog/${category}` },
            { name: p.title, path },
          ]),
          articleJsonLd({
            title: p.title,
            description: p.excerpt,
            path,
            image: p.coverUrl,
            publishedAt: p.publishedAt,
            updatedAt: p.updatedAt,
            authorName: p.authorName,
            tags: p.tags,
            section: c?.name ?? "General",
            wordCount: rt.words,
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/blog" className="hover:text-white">
          Guides
        </Link>{" "}
        <span aria-hidden>/</span>{" "}
        <Link href={`/blog/${category}`} className="hover:text-white">
          {categoryName(category)}
        </Link>
      </nav>
      <article dir={urdu ? "rtl" : undefined} lang={urdu ? "ur" : "en"} className={urdu ? "font-urdu" : undefined}>
        <h1 className={`font-display mt-4 text-5xl text-white ${urdu ? "font-urdu leading-[1.9]" : "leading-tight"}`}>{p.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500" dir="ltr" lang="en">
          <span>{p.authorName}</span>
          {p.publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <time dateTime={p.publishedAt.toISOString()}>{formatDate(p.publishedAt)}</time>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {rt.minutes} min read
          </span>
        </p>
        {p.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverUrl} alt={`Cover image for “${p.title}”`} decoding="async" fetchPriority="high" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        ) : null}
        {p.excerpt ? <p className={`mt-8 text-xl text-zinc-400 ${urdu ? "leading-10" : "leading-8"}`}>{p.excerpt}</p> : null}
        <div className={`t-prose mt-6 text-lg text-zinc-300 ${urdu ? "leading-10" : "leading-8"}`}>{renderMarkdown(p.content)}</div>
        {p.tags.length ? (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags" dir="ltr">
            {p.tags.map((t) => (
              <li key={t} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-400">
                #{t}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
      <div className="mt-14 rounded-2xl border border-white/10 bg-ink-900 p-6">
        <h2 className="font-display text-xl text-white">Want a website like this for your {c?.name.toLowerCase() ?? "business"}?</h2>
        <div className="mt-4">
          <LeadForm defaultCategory={c?.key} compact source={`post:${p.category}/${p.slug}`} />
        </div>
      </div>
    </div>
  );
}
