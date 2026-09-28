import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { blogPostingJsonLd } from "@/modules/shared/jsonld";
import { db } from "@/server/db";
import { Container, RichText } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { getPost, publicPostsWhere } from "@/modules/shared/queries";
import { Breadcrumbs } from "@/modules/shared/ui/breadcrumbs";
import { PostCard } from "@/modules/shared/ui/posts-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const p = await getPost(ctx.tenant.id, slug);
  if (!p) return {};
  return tenantPageMetadata(tc, ctx.lang, {
    title: t(p.title as LocalizedString, ctx.lang),
    description: t(p.excerpt as LocalizedString, ctx.lang) || undefined,
    path: `/blog/${p.slug}`,
    image: p.coverUrl,
    type: "article",
    publishedTime: (p.publishedAt ?? p.createdAt).toISOString(),
    modifiedTime: p.updatedAt.toISOString(),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const [ctx, tc, { slug }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const p = await getPost(ctx.tenant.id, slug);
  if (!p) notFound();
  const title = t(p.title as LocalizedString, ctx.lang);
  const excerpt = t(p.excerpt as LocalizedString, ctx.lang);
  const more = await db.tenantPost.findMany({ where: { ...publicPostsWhere(ctx.tenant.id), NOT: { id: p.id } }, orderBy: { publishedAt: "desc" }, take: 3 });
  return (
    <>
      <JsonLd
        data={[
          blogPostingJsonLd(tc, p, ctx.lang),
          breadcrumbJsonLd(tc, [
            { name: t(ui.home, ctx.lang), path: "/" },
            { name: t(ui.blog, ctx.lang), path: "/blog" },
            { name: title, path: `/blog/${p.slug}` },
          ]),
        ]}
      />
      <article>
        <header className="border-b border-t-border bg-t-muted">
          <Container className="max-w-3xl py-12 sm:py-16">
            <Breadcrumbs items={[{ label: t(ui.blog, ctx.lang), href: "/blog" }, { label: title }]} lang={ctx.lang} className="mb-5" />
            <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
            {excerpt ? <p className="mt-4 text-lg text-t-muted-fg">{excerpt}</p> : null}
            {p.publishedAt ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-t-muted-fg">
                <CalendarDays className="size-4" />
                <time dateTime={p.publishedAt.toISOString()}>{formatDate(p.publishedAt)}</time>
                <span>· {ctx.tenant.name}</span>
              </p>
            ) : null}
          </Container>
        </header>
        <Container className="max-w-3xl py-10 sm:py-14">
          {p.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.coverUrl} alt={title} className="mb-10 aspect-[16/9] w-full rounded-[var(--t-radius)] object-cover" />
          ) : null}
          <RichText value={p.content as LocalizedString} lang={ctx.lang} className="text-base leading-relaxed sm:text-lg" />
          <Link href="/blog" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-t-primary hover:underline">
            <ArrowLeft className="size-4 rtl:rotate-180" /> {ctx.lang === "ur" ? "تمام پوسٹس" : "All posts"}
          </Link>
        </Container>
      </article>
      {more.length ? (
        <section className="border-t border-t-border bg-t-muted py-14">
          <Container>
            <h2 className="font-heading mb-6 text-2xl font-bold">{ctx.lang === "ur" ? "مزید پڑھیں" : "More to read"}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m) => (
                <PostCard key={m.id} ctx={ctx} post={m} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
      <CtaBlock ctx={ctx} />
    </>
  );
}
