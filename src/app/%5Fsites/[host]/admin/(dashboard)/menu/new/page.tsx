import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { MenuItemForm } from "@/components/admin/restaurant/menu-item-form";
import { loadMenuFormOptions } from "@/modules/restaurant/admin-queries";

export default async function NewMenuItemPage() {
  const ctx = await requireTenantAdmin();
  const { categories, groups } = await loadMenuFormOptions(ctx.tenant.id);
  return (
    <>
      <PageHeader title="Add menu item" backHref="/admin/menu" />
      <MenuItemForm categories={categories} groups={groups} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
