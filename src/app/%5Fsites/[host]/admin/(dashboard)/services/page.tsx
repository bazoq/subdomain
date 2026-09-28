import Link from "next/link";
import { Layers, Plus, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { deleteService, toggleService } from "@/modules/shared/services-actions";
import { formatPKR } from "@/lib/utils";
import type { LocalizedString } from "@/lib/i18n";
import { serviceLabels } from "@/components/admin/shared/service-labels";


export default async function ServicesAdminPage() {
  const ctx = await requireTenantAdmin();
  const labels = serviceLabels(ctx.category.key);
  const rows = await db.service.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] });
  const addBtn = (
    <Link href="/admin/services/new" className={buttonVariants({})}>
      <Plus /> Add {labels.singular.toLowerCase()}
    </Link>
  );
  return (
    <>
      <PageHeader title={labels.plural} description={`${labels.plural} listed on your website at /services.`} actions={addBtn} />
      {rows.length === 0 ? (
        <EmptyState icon={<Layers />} title={`No ${labels.plural.toLowerCase()} yet`} description="Add what you offer so visitors can browse and enquire." action={addBtn} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              {labels.pricing ? <TH>Price</TH> : null}
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const name = (r.name as LocalizedString).en;
              return (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/services/${r.id}`} className="flex items-center gap-3">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt="" className="size-10 rounded-md object-cover" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                          <Layers className="size-4" />
                        </span>
                      )}
                      <span>
                        <span className="block font-medium text-slate-900 hover:underline">{name}</span>
                        <span className="block text-xs text-slate-500">/services/{r.slug}</span>
                      </span>
                    </Link>
                  </TD>
                  {labels.pricing ? <TD>{r.priceFrom != null ? `From ${formatPKR(r.priceFrom)}` : <span className="text-slate-400">—</span>}</TD> : null}
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={r.isActive ? "success" : "default"}>{r.isActive ? "Visible" : "Hidden"}</Badge>
                      {r.isFeatured ? <Badge tone="brand">Featured</Badge> : null}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <ActionButton size="sm" variant="ghost" action={() => toggleService(r.id, "isActive", !r.isActive)}>
                        {r.isActive ? "Hide" : "Show"}
                      </ActionButton>
                      <Link href={`/admin/services/${r.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                      </Link>
                      <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Delete this ${labels.singular.toLowerCase()}?`} action={() => deleteService(r.id)}>
                        <Trash2 />
                      </ActionButton>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
