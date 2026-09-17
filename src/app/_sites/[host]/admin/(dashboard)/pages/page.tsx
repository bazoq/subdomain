import Link from "next/link";
import { FileText, Plus, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { deletePage, togglePage } from "@/modules/shared/pages-actions";
import { asLocalized } from "@/modules/shared/content-types";
import { formatDate } from "@/lib/utils";

export default async function PagesAdminPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.sitePage.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const add = (
    <Link href="/admin/pages/new" className={buttonVariants({})}>
      <Plus /> New page
    </Link>
  );
  return (
    <>
      <PageHeader title="Pages" description="Extra pages such as About, Privacy policy or Terms. Available at /p/your-slug." actions={add} />
      {rows.length === 0 ? (
        <EmptyState icon={<FileText />} title="No extra pages yet" description="Create an About page, a return policy or anything else your customers need." action={add} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Page</TH>
              <TH>Status</TH>
              <TH>Menu</TH>
              <TH>Updated</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link href={`/admin/pages/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {asLocalized(r.title).en}
                  </Link>
                  <p className="text-xs text-slate-500">/p/{r.slug}</p>
                </TD>
                <TD>
                  <Badge tone={r.enabled ? "success" : "default"}>{r.enabled ? "Live" : "Disabled"}</Badge>
                </TD>
                <TD>
                  <ActionButton size="sm" variant="ghost" action={() => togglePage(r.id, "showInNav", !r.showInNav)}>
                    {r.showInNav ? "In menu ✓" : "Add to menu"}
                  </ActionButton>
                </TD>
                <TD className="text-xs text-slate-500">{formatDate(r.updatedAt)}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <ActionButton size="sm" variant="ghost" action={() => togglePage(r.id, "enabled", !r.enabled)}>
                      {r.enabled ? "Disable" : "Enable"}
                    </ActionButton>
                    <Link href={`/admin/pages/${r.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Edit
                    </Link>
                    <ActionButton size="sm" variant="ghost" className="text-red-600" confirm="Delete this page?" action={() => deletePage(r.id)}>
                      <Trash2 />
                    </ActionButton>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
