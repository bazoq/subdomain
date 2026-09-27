import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader, Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/admin/shared/user-forms";

export default async function ChangePasswordPage() {
  const ctx = await requireTenantAdmin();
  return (
    <>
      <PageHeader title="Change password" backHref="/admin/users" description={`Signed in as ${ctx.user.name} (@${ctx.user.username}).`} />
      <Card>
        <CardContent>
          <ChangePasswordForm username={ctx.user.username} />
        </CardContent>
      </Card>
    </>
  );
}
