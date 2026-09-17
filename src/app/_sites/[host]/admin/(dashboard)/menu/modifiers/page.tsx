import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { ModifierGroupManager, type ModifierGroupRow } from "@/components/admin/restaurant/modifier-group-manager";
import type { LocalizedString } from "@/lib/i18n";

export default async function ModifiersPage() {
  const ctx = await requireTenantAdmin();
  const rows = await db.modifierGroup.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { modifiers: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }, _count: { select: { items: true } } },
  });
  const data: ModifierGroupRow[] = rows.map((g) => ({
    id: g.id,
    name: g.name as LocalizedString,
    minSelect: g.minSelect,
    maxSelect: g.maxSelect,
    required: g.required,
    sortOrder: g.sortOrder,
    itemCount: g._count.items,
    modifiers: g.modifiers.map((m) => ({ id: m.id, name: m.name as LocalizedString, price: m.price, isActive: m.isActive })),
  }));
  return (
    <>
      <PageHeader title="Add-ons & modifiers" description="Option groups customers choose from when adding an item: extra toppings, crust type, drinks, sauces." backHref="/admin/menu" />
      <ModifierGroupManager rows={data} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
