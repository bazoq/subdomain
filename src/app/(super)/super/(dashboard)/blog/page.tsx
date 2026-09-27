import Link from "next/link";
import { Newspaper, Plus } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Blog" };

const PAGE = 25;

export default async function BlogListPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuper();
  const sp = await searchParams;
  const category = sp.category ?? "";
  const published = sp.published ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where: Prisma.BlogPostWhereInput = {
    ...(category ? { category } : {}),
    ...(published === "1" ? { published: true } : published === "0" ? { published: false } : {}),
  };
  const [rows, total] = await Promise.all([
    db.blogPost.findMany({ where, orderBy: [{ updatedAt: "desc" }], take: PAGE, skip: (page - 1) * PAGE }),
    db.blogPost.count({ where }),
  ]);
  const hrefFor = (p: number) => `/super/blog?${new URLSearchParams({ ...(category ? { category } : {}), ...(published ? { published } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles on the platform website, one blog per business category."
        actions={
          <Link href="/super/blog/new">
            <Button>
              <Plus /> New post
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Select name="category" defaultValue={category} className="w-48">
          <option value="">All categories</option>
          <option value="general">General</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="published" defaultValue={published} className="w-40">
          <option value="">Any status</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Newspaper />} title="No posts yet" description="Write the first article for a category." action={<Link href="/super/blog/new"><Button>New post</Button></Link>} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Title</TH>
              <TH>Category</TH>
              <TH>Status</TH>
              <TH>Author</TH>
              <TH>Updated</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => (
              <TR key={p.id}>
                <TD>
                  <Link href={`/super/blog/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-500">/{p.category}/{p.slug}</p>
                </TD>
                <TD>{p.category === "general" ? "General" : (getCategory(p.category)?.name ?? p.category)}</TD>
                <TD>
                  <Badge tone={p.published ? "success" : "warning"}>{p.published ? "Published" : "Draft"}</Badge>
                  {p.published && p.publishedAt ? <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(p.publishedAt)}</p> : null}
                </TD>
                <TD>{p.authorName}</TD>
                <TD className="text-xs text-slate-500">{formatDate(p.updatedAt, true)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={hrefFor} />
    </>
  );
}
