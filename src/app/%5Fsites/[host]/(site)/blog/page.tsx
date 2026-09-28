import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { db } from "@/server/db";
import { Container } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { PostCard } from "@/modules/shared/ui/posts-block";
import { PublicPagination } from "@/modules/shared/ui/pagination";
import { publicPostsWhere } from "@/modules/shared/queries";

const PAGE_SIZE = 9;
type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [ctx, tc, sp] = await Promise.all([getSiteContext(), requireTenant(), searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  return tenantPageMetadata(tc, ctx.lang, {
    title: page > 1 ? `${t(ui.blog, ctx.lang)} – ${page}` : t(ui.blog, ctx.lang),
    description: `News, offers and updates from ${ctx.tenant.name}.`,
    path: page > 1 ? `/blog?page=${page}` : "/blog",
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const ctx = await getSiteContext();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = publicPostsWhere(ctx.tenant.id);
  const [rows, total] = await Promise.all([
    db.tenantPost.findMany({ where, orderBy: { publishedAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    db.tenantPost.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = t(ui.blog, ctx.lang);
  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container>
          {rows.length === 0 ? (
            <p className="t-card px-6 py-16 text-center text-t-muted-fg">{ctx.lang === "ur" ? "ابھی کوئی پوسٹ نہیں۔" : "No posts yet. Check back soon."}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => (
                <PostCard key={p.id} ctx={ctx} post={p} />
              ))}
            </div>
          )}
          <PublicPagination page={page} pageCount={pageCount} hrefFor={(p) => (p === 1 ? "/blog" : `/blog?page=${p}`)} lang={ctx.lang} className="mt-10" />
        </Container>
      </section>
    </>
  );
}
