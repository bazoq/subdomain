import { requireSuper } from "@/server/auth/guards";
import { PageHeader, Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/admin/super/super-users";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const me = await requireSuper();
  return (
    <>
      <PageHeader title="Change my password" description={`Signed in as ${me.username}.`} backHref="/super/users" />
      <Card>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
