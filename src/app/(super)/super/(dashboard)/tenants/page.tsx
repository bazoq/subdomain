import Link from "next/link";
import { Globe, Plus, ExternalLink } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getTemplateMeta } from "@/templates/registry";
import { hostUrl } from "@/config/site";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

const PAGE = 25;

export default async function TenantsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSuper();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category ?? "";
  const status = sp.status ?? "";
  const demo = sp.demo ?? ""; // "" all | "1" only demos | "0" hide demos
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.TenantWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { domains: { some: { hostname: { contains: q.toLowerCase() } } } }] } : {}),
    ...(category ? { category } : {}),
    ...(status === "DRAFT" || status === "ACTIVE" || status === "SUSPENDED" ? { status } : {}),
    ...(demo === "1" ? { isDemo: true } : demo === "0" ? { isDemo: false } : {}),
  };
  const [rows, total] = await Promise.all([
    db.tenant.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE, include: { domains: true } }),
    db.tenant.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const hrefFor = (p: number) => {
    const u = new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), ...(status ? { status } : {}), ...(demo ? { demo } : {}), page: String(p) });
    return `/super/tenants?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Websites"
        description={`${total} website${total === 1 ? "" : "s"} on the platform.`}
        actions={
          <Link href="/super/tenants/new">
            <Button>
              <Plus /> New website
            </Button>
          </Link>
        }
      />
      <form method="get" className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search name, slug or hostname" />
        <Select name="category" defaultValue={category} className="sm:w-48">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="sm:w-36">
          <option value="">Any status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Select name="demo" defaultValue={demo} className="sm:w-36">
          <option value="">Demos + real</option>
          <option value="0">Hide demos</option>
          <option value="1">Demos only</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Globe />}
          title="No websites found"
          description={q || category || status || demo ? "Try clearing the filters." : "Create the first customer website."}
          action={
            <Link href="/super/tenants/new">
              <Button>
                <Plus /> New website
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Template</TH>
              <TH>Primary hostname</TH>
              <TH>Status</TH>
              <TH>Created</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((t) => {
              const primary = t.domains.find((d) => d.isPrimary) ?? t.domains[0];
              const meta = getTemplateMeta(t.templateId);
              return (
                <TR key={t.id}>
                  <TD>
                    <Link href={`/super/tenants/${t.id}`} className="font-medium text-slate-900 hover:underline">
                      {t.name}
                    </Link>
                    {t.isDemo ? (
                      <Badge tone="purple" className="ml-2">
                        demo
                      </Badge>
                    ) : null}
                    <p className="text-xs text-slate-500">{t.slug}</p>
                  </TD>
                  <TD>{getCategory(t.category)?.name ?? t.category}</TD>
                  <TD>
                    <span className="text-slate-900">{meta?.name ?? "—"}</span>
                    {meta ? <span className="ml-1 font-mono text-xs text-brand-600">#{meta.code}</span> : null}
                    <p className="font-mono text-[11px] text-slate-500">{t.templateId}</p>
                  </TD>
                  <TD>
                    {primary ? (
                      <a href={hostUrl(primary.hostname)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                        {primary.hostname}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">no hostname</span>
                    )}
                    {t.domains.length > 1 ? <span className="ml-1 text-xs text-slate-500">+{t.domains.length - 1}</span> : null}
                  </TD>
                  <TD>
                    <StatusBadge status={t.status} />
                  </TD>
                  <TD className="text-xs text-slate-500">{formatDate(t.createdAt)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
    </>
  );
}
