import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/shared/settings-form";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTenantAdmin();
  const { tab } = await searchParams;
  return (
    <>
      <PageHeader title="Settings" description="Branding, contact details, languages, opening hours and more. Each section saves separately." />
      <SettingsForm initial={ctx.settings} modules={ctx.category.modules} initialTab={tab} />
    </>
  );
}
