import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCategory } from "@/lib/categories";
import { renderMarkdown } from "@/server/super/markdown";
import { formatDate } from "@/lib/utils";
import { LeadForm } from "@/components/super-site/lead-form";

export const dynamic = "force-dynamic";

async function getPost(category: string, slug: string) {
  return db.blogPost.findFirst({ where: { category, slug, published: true } }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const p = await getPost(category, slug);
  if (!p) return {};
  return { title: p.title, description: p.excerpt, openGraph: p.coverUrl ? { images: [p.coverUrl] } : undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const p = await getPost(category, slug);
  if (!p) notFound();
  const c = getCategory(category);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link href="/blog" className="hover:text-slate-900">
          Guides
        </Link>{" "}
        /{" "}
        <Link href={`/blog/${category}`} className="hover:text-slate-900">
          {c?.name ?? category}
        </Link>
      </nav>
      <h1 className="font-heading mt-4 text-4xl font-bold leading-tight text-slate-900">{p.title}</h1>
      <p className="mt-3 text-sm text-slate-500">
        {p.authorName} · {p.publishedAt ? formatDate(p.publishedAt) : ""}
      </p>
      {p.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.coverUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      ) : null}
      <div className="t-prose mt-8 text-lg leading-8 text-slate-700">{renderMarkdown(p.content)}</div>
      {p.tags.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              #{t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-heading text-xl font-bold text-slate-900">Want a website like this for your {c?.name.toLowerCase() ?? "business"}?</h3>
        <div className="mt-4">
          <LeadForm defaultCategory={c?.key} compact />
        </div>
      </div>
    </div>
  );
}
