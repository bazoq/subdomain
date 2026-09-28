import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { CategoryManager, type CategoryRow } from "@/components/admin/restaurant/category-manager";
import type { LocalizedString } from "@/lib/i18n";

export default async function MenuCategoriesPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.menuCategory.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { items: true } } },
  });
  const data: CategoryRow[] = rows.map((r) => ({ id: r.id, name: r.name as LocalizedString, slug: r.slug, imageUrl: r.imageUrl, isActive: r.isActive, itemCount: r._count.items }));
  return (
    <>
      <PageHeader title="Menu categories" description="Group your items (Pizzas, Deals, Sides, Drinks…). Drag order with the arrows." backHref="/admin/menu" />
      <CategoryManager rows={data} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
