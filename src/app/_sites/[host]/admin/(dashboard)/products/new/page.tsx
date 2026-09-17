import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/ecommerce/product-form";
import { asLocalized } from "@/modules/ecommerce/mappers";

export default async function NewProductPage() {
  const ctx = await requireTenantAdmin();
  const cats = await db.productCategory.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }] });
  const byId = new Map(cats.map((c) => [c.id, c]));
  const categories = cats.map((c) => {
    const parent = c.parentId ? byId.get(c.parentId) : null;
    return { id: c.id, label: parent ? `${asLocalized(parent.name).en} › ${asLocalized(c.name).en}` : asLocalized(c.name).en };
  });
  return (
    <>
      <PageHeader title="Add product" backHref="/admin/products" />
      <ProductForm categories={categories} urduEnabled={ctx.settings.languages.urduEnabled} isMedical={ctx.category.modules.includes("medical")} lowStockThreshold={ctx.settings.commerce.lowStockThreshold} />
    </>
  );
}
