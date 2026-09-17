import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PostForm } from "@/components/admin/shared/post-form";
import { asLocalized } from "@/modules/shared/content-types";
import type { PostInput } from "@/modules/shared/posts-actions";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const row = await db.tenantPost.findFirst({ where: { id, tenantId: ctx.tenant.id } });
  if (!row) notFound();
  const initial: PostInput = {
    title: asLocalized(row.title),
    slug: row.slug,
    excerpt: asLocalized(row.excerpt),
    content: asLocalized(row.content),
    coverUrl: row.coverUrl ?? "",
    published: row.published,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : "",
  };
  return (
    <>
      <PageHeader
        title={initial.title.en}
        backHref="/admin/posts"
        actions={
          row.published ? (
            <Link href={`/blog/${row.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink /> View on site
            </Link>
          ) : null
        }
      />
      <PostForm id={row.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
