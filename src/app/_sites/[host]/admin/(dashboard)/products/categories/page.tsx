import { FolderTree, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/admin/action-button";
import { CategoryFormButton } from "@/components/admin/ecommerce/category-form";
import { deleteCategory } from "@/modules/ecommerce/actions";
import { asLocalized } from "@/modules/ecommerce/mappers";

export default async function ProductCategoriesPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.productCategory.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
  const urdu = ctx.settings.languages.urduEnabled;
  const parents = rows.filter((r) => !r.parentId).map((r) => ({ id: r.id, label: asLocalized(r.name).en }));
  // order: each top-level category followed by its children
  const ordered = rows.filter((r) => !r.parentId).flatMap((p) => [p, ...rows.filter((c) => c.parentId === p.id)]);
  const orphans = rows.filter((r) => r.parentId && !rows.some((p) => p.id === r.parentId));
  const list = [...ordered, ...orphans];

  return (
    <>
      <PageHeader title="Product categories" description="Group products for browsing. One level of sub-categories is supported." backHref="/admin/products" actions={<CategoryFormButton parents={parents} urduEnabled={urdu} />} />
      {list.length === 0 ? (
        <EmptyState icon={<FolderTree />} title="No categories yet" description="Create categories like Cookware, Men, Women or Medicines to organise your shop." action={<CategoryFormButton parents={parents} urduEnabled={urdu} />} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Category</TH>
              <TH>Slug</TH>
              <TH>Products</TH>
              <TH>Order</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {list.map((c) => {
              const name = asLocalized(c.name);
              return (
                <TR key={c.id}>
                  <TD>
                    <div className={c.parentId ? "flex items-center gap-2 pl-5" : "flex items-center gap-2"}>
                      {c.parentId ? <span className="text-slate-300">└</span> : null}
                      <div className="size-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{name.en}</p>
                        {name.ur ? <p className="font-urdu text-xs text-slate-500">{name.ur}</p> : null}
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-500">/shop/c/{c.slug}</TD>
                  <TD>{c._count.products}</TD>
                  <TD>{c.sortOrder}</TD>
                  <TD>
                    <Badge tone={c.isActive ? "success" : "default"}>{c.isActive ? "Visible" : "Hidden"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <CategoryFormButton
                        id={c.id}
                        parents={parents}
                        urduEnabled={urdu}
                        variant="outline"
                        initial={{ name, slug: c.slug, parentId: c.parentId ?? "", imageUrl: c.imageUrl ?? "", sortOrder: c.sortOrder, isActive: c.isActive }}
                      />
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        confirm={`Delete "${name.en}"? ${c._count.products} product(s) will become uncategorised${c._count.children ? ` and ${c._count.children} sub-categor${c._count.children === 1 ? "y" : "ies"} will move to top level` : ""}.`}
                        action={() => deleteCategory(c.id)}
                      >
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
