import Link from "next/link";
import { Newspaper, Plus, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { deletePost, togglePostPublished } from "@/modules/shared/posts-actions";
import { asLocalized } from "@/modules/shared/content-types";
import { formatDate } from "@/lib/utils";

const PAGE = 25;

export default async function PostsAdminPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { tenantId: ctx.tenant.id, ...(sp.status === "published" ? { published: true } : sp.status === "draft" ? { published: false } : {}) };
  const [rows, total] = await Promise.all([db.tenantPost.findMany({ where, orderBy: { updatedAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }), db.tenantPost.count({ where })]);
  const add = (
    <Link href="/admin/posts/new" className={buttonVariants({})}>
      <Plus /> New post
    </Link>
  );
  const filter = (v: string, label: string) => (
    <Link key={v} href={v ? `/admin/posts?status=${v}` : "/admin/posts"} className={buttonVariants({ variant: (sp.status ?? "") === v ? "secondary" : "ghost", size: "sm" })}>
      {label}
    </Link>
  );
  return (
    <>
      <PageHeader title="Blog / news" description="Articles, offers and announcements shown at /blog." actions={add} />
      <div className="mb-3 flex gap-1">
        {filter("", "All")}
        {filter("published", "Published")}
        {filter("draft", "Drafts")}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Newspaper />} title="No posts yet" description="Share offers, new arrivals or tips – it helps with Google too." action={add} />
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Title</TH>
                <TH>Status</TH>
                <TH>Date</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/posts/${r.id}`} className="flex items-center gap-3">
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverUrl} alt="" className="h-10 w-16 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-10 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                          <Newspaper className="size-4" />
                        </span>
                      )}
                      <span>
                        <span className="block font-medium text-slate-900 hover:underline">{asLocalized(r.title).en}</span>
                        <span className="block text-xs text-slate-500">/blog/{r.slug}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD>
                    <Badge tone={r.published ? "success" : "warning"}>{r.published ? "Published" : "Draft"}</Badge>
                  </TD>
                  <TD className="text-xs text-slate-500">{r.publishedAt ? formatDate(r.publishedAt) : `Edited ${formatDate(r.updatedAt)}`}</TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <ActionButton size="sm" variant="ghost" action={() => togglePostPublished(r.id, !r.published)}>
                        {r.published ? "Unpublish" : "Publish"}
                      </ActionButton>
                      <Link href={`/admin/posts/${r.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                      </Link>
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this post?" action={() => deletePost(r.id)}>
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={(p) => `/admin/posts?page=${p}${sp.status ? `&status=${sp.status}` : ""}`} />
        </>
      )}
    </>
  );
}
