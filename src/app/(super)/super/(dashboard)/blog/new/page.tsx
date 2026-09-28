import { brand } from "@/config/brand";
import { requireSuper } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { BlogForm } from "@/components/admin/super/blog-form";

export const metadata = { title: "New blog post" };

export default async function NewBlogPostPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireSuper();
  const { category } = await searchParams;
  return (
    <>
      <PageHeader title="New post" backHref="/super/blog" />
      <BlogForm initial={category ? { category, title: "", slug: "", excerpt: "", content: "", coverUrl: "", tags: [], published: false, publishedAt: "", authorName: `${brand.name} Team` } : undefined} />
    </>
  );
}
