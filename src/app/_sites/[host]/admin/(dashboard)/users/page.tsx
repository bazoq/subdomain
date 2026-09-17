import Link from "next/link";
import { KeyRound, Trash2 } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { AddUserButton, ResetPasswordButton } from "@/components/admin/shared/user-forms";
import { deleteTenantUser, setTenantUserActive, updateTenantUserRole } from "@/modules/shared/users-actions";
import { formatDate } from "@/lib/utils";

export default async function UsersAdminPage() {
  const ctx = await requireTenantAdmin();
  const isOwner = ctx.user.role === "OWNER";
  const rows = isOwner ? await db.tenantUser.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }) : [ctx.user];
  const owners = rows.filter((u) => u.role === "OWNER" && u.isActive).length;
  const pwLink = (
    <Link href="/admin/users/password" className={buttonVariants({ variant: "outline" })}>
      <KeyRound /> Change my password
    </Link>
  );
  return (
    <>
      <PageHeader title="Users" description={isOwner ? "People who can sign in to this admin. Only the owner can manage users." : "Your account."} actions={isOwner ? <>{pwLink}<AddUserButton /></> : pwLink} />
      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Status</TH>
            <TH>Last login</TH>
            {isOwner ? <TH className="text-right">Actions</TH> : null}
          </tr>
        </THead>
        <TBody>
          {rows.map((u) => {
            const me = u.id === ctx.user.id;
            const lastOwner = u.role === "OWNER" && owners <= 1;
            return (
              <TR key={u.id}>
                <TD>
                  <p className="font-medium text-slate-900">
                    {u.name} {me ? <span className="text-xs text-slate-400">(you)</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{u.username}
                    {u.email ? ` · ${u.email}` : ""}
                  </p>
                </TD>
                <TD>
                  {isOwner && u.role !== "OWNER" ? (
                    <div className="flex gap-1">
                      <Badge tone={u.role === "ADMIN" ? "brand" : "default"}>{u.role}</Badge>
                      <ActionButton size="sm" variant="ghost" className="h-6 px-2 text-xs" action={() => updateTenantUserRole(u.id, u.role === "ADMIN" ? "STAFF" : "ADMIN")}>
                        Make {u.role === "ADMIN" ? "staff" : "admin"}
                      </ActionButton>
                    </div>
                  ) : (
                    <Badge tone={u.role === "OWNER" ? "purple" : u.role === "ADMIN" ? "brand" : "default"}>{u.role}</Badge>
                  )}
                </TD>
                <TD>
                  <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Deactivated"}</Badge>
                  {u.lockedUntil && u.lockedUntil > new Date() ? <Badge tone="warning" className="ms-1">Locked</Badge> : null}
                </TD>
                <TD className="text-xs text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "Never"}</TD>
                {isOwner ? (
                  <TD>
                    <div className="flex justify-end gap-1">
                      <ResetPasswordButton id={u.id} name={u.name} />
                      {!me && !lastOwner ? (
                        <ActionButton size="sm" variant="ghost" action={() => setTenantUserActive(u.id, !u.isActive)}>
                          {u.isActive ? "Deactivate" : "Activate"}
                        </ActionButton>
                      ) : null}
                      {!me && !lastOwner ? (
                        <ActionButton size="sm" variant="ghost" className="text-red-600" confirm={`Remove ${u.name}? They will lose access immediately.`} action={() => deleteTenantUser(u.id)}>
                          <Trash2 />
                        </ActionButton>
                      ) : null}
                    </div>
                  </TD>
                ) : null}
              </TR>
            );
          })}
        </TBody>
      </Table>
    </>
  );
}
