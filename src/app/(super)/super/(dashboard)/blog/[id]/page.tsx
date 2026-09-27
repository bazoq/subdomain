import { notFound } from "next/navigation";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { BlogForm } from "@/components/admin/super/blog-form";

export const metadata = { title: "Edit post" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuper();
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <>
      <PageHeader title={post.title} description={`/${post.category}/${post.slug}`} backHref="/super/blog" />
      <BlogForm
        id={post.id}
        initial={{
          category: post.category,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverUrl: post.coverUrl ?? "",
          tags: post.tags,
          published: post.published,
          publishedAt: post.publishedAt?.toISOString() ?? "",
          authorName: post.authorName,
        }}
      />
    </>
  );
}
