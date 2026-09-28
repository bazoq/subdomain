import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { db } from "@/server/db";
import { brand } from "@/config/brand";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { getGuide } from "@/lib/guides";
import { galleryTemplatesForCategory } from "@/server/super/gallery";
import { TemplateCard } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { formatDate } from "@/lib/utils";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd, isMostlyUrdu, pageMetadata, readingTime } from "@/components/super-site/seo";

export const dynamic = "force-dynamic";

/** Posts written in the super admin under "General" live at /blog/general (no built-in guide). */
const GENERAL = "general";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  if (category === GENERAL) {
    return pageMetadata({ title: "Articles", description: `News and tips from ${brand.name} on selling online in Pakistan.`, path: `/blog/${GENERAL}` });
  }
  const c = getCategory(category);
  if (!c) return {};
  const g = getGuide(c.key);
  return pageMetadata({ title: g.title, description: g.intro, path: `/blog/${c.key}`, type: "article" });
}

export function generateStaticParams() {
  return [...CATEGORIES.map((c) => ({ category: c.key })), { category: GENERAL }];
}

type PostRow = { id: string; slug: string; title: string; excerpt: string; publishedAt: Date | null; content: string };

function PostList({ posts, category }: { posts: PostRow[]; category: string }) {
  return (
    <ul className="mt-4 space-y-3">
      {posts.map((p) => {
        const urdu = isMostlyUrdu(p.title + " " + p.excerpt);
        return (
          <li key={p.id}>
            <Link href={`/blog/${category}/${p.slug}`} className="block rounded-xl border border-white/10 p-4 hover:border-gold-400/40 hover:bg-white/[0.03]" dir={urdu ? "rtl" : undefined} lang={urdu ? "ur" : undefined}>
              <p className={`font-semibold text-white ${urdu ? "font-urdu leading-9" : ""}`}>{p.title}</p>
              <p className={`mt-1 line-clamp-2 text-sm text-zinc-500 ${urdu ? "font-urdu leading-8" : ""}`}>{p.excerpt}</p>
              <p className="mt-2 text-xs text-zinc-500" dir="ltr" lang="en">
                {p.publishedAt ? formatDate(p.publishedAt) : ""} · {readingTime(p.content).minutes} min read
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CategoryBlogPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  if (category === GENERAL) {
    const posts = await db.blogPost
      .findMany({ where: { category: GENERAL, published: true }, orderBy: { publishedAt: "desc" }, select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true, content: true } })
      .catch(() => []);
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: "Articles", path: `/blog/${GENERAL}` },
          ])}
        />
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <Link href="/blog" className="hover:text-white">
            Guides
          </Link>{" "}
          <span aria-hidden>/</span> <span className="text-white">Articles</span>
        </nav>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Blog</p>
        <h1 className="font-display mt-2 text-5xl leading-tight text-white">Articles from {brand.name}</h1>
        <p className="mt-3 text-zinc-400">News, tips and stories about selling online in Pakistan.</p>
        {posts.length ? (
          <PostList posts={posts} category={GENERAL} />
        ) : (
          <p className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center text-zinc-500">
            No articles yet.{" "}
            <Link href="/blog" className="font-semibold text-gold-300 hover:underline">
              Read the feature guides
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  const c = getCategory(category);
  if (!c) notFound();
  const guide = getGuide(c.key);
  const [posts, templates] = await Promise.all([
    db.blogPost
      .findMany({ where: { category: c.key, published: true }, orderBy: { publishedAt: "desc" }, select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true, content: true } })
      .catch(() => []),
    galleryTemplatesForCategory(c.key).then((l) => l.slice(0, 3)),
  ]);
  const guideText = [guide.intro, ...guide.features, ...guide.sections.flatMap((s) => [s.heading, ...s.body]), ...guide.faq.flatMap((f) => [f.q, f.a])].join(" ");
  const rt = readingTime(guideText);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: c.name, path: `/blog/${c.key}` },
          ]),
          articleJsonLd({ title: guide.title, description: guide.intro, path: `/blog/${c.key}`, section: c.name, wordCount: rt.words, tags: [c.name, "Pakistan", "website"] }),
          faqJsonLd(guide.faq),
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/blog" className="hover:text-white">
          Guides
        </Link>{" "}
        <span aria-hidden>/</span> <span className="text-white">{c.name}</span>
      </nav>
      <div className="mt-6 grid gap-12 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{c.name} · Feature guide</p>
          <h1 className="font-display mt-2 text-5xl leading-tight text-white">{guide.title}</h1>
          <p className="mt-2 text-xs text-zinc-500">
            {rt.minutes} min read · by {brand.name}
          </p>
          <p className="mt-4 text-lg leading-8 text-zinc-400">{guide.intro}</p>
          <p className="mt-2 font-urdu text-base leading-8 text-zinc-400" dir="rtl" lang="ur">
            {c.nameUr}
          </p>

          <div className="mt-8 rounded-2xl border border-gold-400/20 bg-gold-400/[0.06] p-6">
            <h2 className="font-semibold text-white">What every {c.name.toLowerCase()} template includes</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {guide.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-zinc-300">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {guide.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="font-display text-3xl text-white">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 leading-7 text-zinc-400">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section className="mt-12" aria-labelledby="faq-title">
            <h2 id="faq-title" className="font-display text-3xl text-white">
              Frequently asked
            </h2>
            <dl className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/10">
              {guide.faq.map((f) => (
                <div key={f.q} className="p-5">
                  <dt className="font-semibold text-white">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-6 text-zinc-400">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {posts.length ? (
            <section className="mt-14" aria-labelledby="more-title">
              <h2 id="more-title" className="font-display text-3xl text-white">
                More articles for {c.plural.toLowerCase()}
              </h2>
              <PostList posts={posts} category={c.key} />
            </section>
          ) : null}
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-semibold text-white">Templates for {c.plural.toLowerCase()}</h2>
            <div className="mt-4 space-y-4">
              {templates.map((t) => (
                <TemplateCard key={t.id} meta={t} categoryName={c.name} />
              ))}
            </div>
            <Link href={`/templates/${c.key}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 hover:underline">
              See all {c.templateCount} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900 p-5">
            <h2 className="font-semibold text-white">Get a {c.name.toLowerCase()} website</h2>
            <p className="mt-1 text-sm text-zinc-500">Leave your number, we will call you.</p>
            <div className="mt-4">
              <LeadForm defaultCategory={c.key} compact source={`guide:${c.key}`} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
