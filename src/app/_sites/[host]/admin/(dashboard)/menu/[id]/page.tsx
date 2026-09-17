import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { MenuItemForm } from "@/components/admin/restaurant/menu-item-form";
import { loadMenuFormOptions } from "@/modules/restaurant/admin-queries";
import type { MenuItemInput } from "@/modules/restaurant/actions";
import { MENU_TAGS, parseSizes, type MenuTag } from "@/modules/restaurant/types";
import type { LocalizedString } from "@/lib/i18n";

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenantAdmin();
  const { id } = await params;
  const [row, opts] = await Promise.all([
    db.menuItem.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { modifierGroups: { select: { groupId: true } } } }),
    loadMenuFormOptions(ctx.tenant.id),
  ]);
  if (!row) notFound();
  const name = row.name as LocalizedString;
  const description = (row.description as Partial<LocalizedString> | null) ?? { en: "" };
  const initial: MenuItemInput = {
    name,
    description: { en: description.en ?? "", ur: description.ur },
    slug: row.slug,
    categoryId: row.categoryId,
    price: row.price,
    sizes: parseSizes(row.sizes),
    imageUrl: row.imageUrl ?? "",
    tags: row.tags.filter((x): x is MenuTag => (MENU_TAGS as readonly string[]).includes(x)),
    modifierGroupIds: row.modifierGroups.map((g) => g.groupId),
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
  };
  return (
    <>
      <PageHeader title={name.en} description="Edit menu item" backHref="/admin/menu" />
      <MenuItemForm id={row.id} initial={initial} categories={opts.categories} groups={opts.groups} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
