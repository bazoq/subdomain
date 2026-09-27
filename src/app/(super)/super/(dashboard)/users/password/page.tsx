import { requireSuperPage } from "@/server/super/access";
import { PageHeader, Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/admin/super/super-users";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const me = await requireSuperPage(["SUPERADMIN", "EDITOR"]);
  return (
    <>
      <PageHeader title="Change my password" description={`Signed in as ${me.username} (${me.role}).`} backHref={me.role === "SUPERADMIN" ? "/super/users" : "/super"} />
      <Card>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
