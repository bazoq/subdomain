import Link from "next/link";
import { KeyRound, LockOpen, Trash2, UserX, UserCheck } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { AddUserButton, ResetPasswordButton } from "@/components/admin/shared/user-forms";
import { deleteTenantUser, setTenantUserActive, unlockTenantUser, updateTenantUserRole } from "@/modules/shared/users-actions";
import { formatDate } from "@/lib/utils";

const ROLE_HELP: Record<string, string> = {
  OWNER: "Full access, including users and settings",
  ADMIN: "Everything except managing users",
  STAFF: "Orders, leads and content",
};

export default async function UsersAdminPage() {
  const ctx = await requireTenantAdmin();
  const isOwner = ctx.user.role === "OWNER";
  const rows = isOwner ? await db.tenantUser.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }) : [ctx.user];
  const activeOwners = rows.filter((u) => u.role === "OWNER" && u.isActive).length;
  const now = new Date();
  const pwLink = (
    <Link href="/admin/users/password" className={buttonVariants({ variant: "outline" })}>
      <KeyRound /> Change my password
    </Link>
  );
  return (
    <>
      <PageHeader
        title="Users"
        description={isOwner ? "People who can sign in to this admin. Only the owner can add, remove or reset other users." : "Your account. Ask the owner to add or change other users."}
        actions={
          isOwner ? (
            <>
              {pwLink}
              <AddUserButton />
            </>
          ) : (
            pwLink
          )
        }
      />
      {isOwner && activeOwners <= 1 ? (
        <Alert tone="info" className="mb-4" title="You are the only owner">
          The last owner account cannot be deactivated or removed, so you never lose access to your website. Promote a trusted person to owner through support if you need a second owner.
        </Alert>
      ) : null}
      <Table responsive>
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
            const lastOwner = u.role === "OWNER" && activeOwners <= 1;
            const locked = Boolean(u.lockedUntil && u.lockedUntil > now);
            const canModify = isOwner && !me && !lastOwner;
            return (
              <TR key={u.id}>
                <TD label="User">
                  <p className="font-medium text-slate-900">
                    {u.name} {me ? <span className="text-xs font-normal text-slate-400">(you)</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{u.username}
                    {u.email ? ` · ${u.email}` : ""}
                  </p>
                </TD>
                <TD label="Role">
                  <div className="flex flex-wrap items-center gap-1 max-sm:justify-end">
                    <Badge tone={u.role === "OWNER" ? "purple" : u.role === "ADMIN" ? "brand" : "default"} title={ROLE_HELP[u.role]}>
                      {u.role}
                    </Badge>
                    {isOwner && u.role !== "OWNER" ? (
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        confirm={{
                          title: `Change ${u.name}'s role?`,
                          message: u.role === "ADMIN" ? `${u.name} becomes Staff: they keep orders, leads and content but lose access to settings and the media library.` : `${u.name} becomes Admin: they can change settings and everything except users.`,
                          confirmLabel: `Make ${u.role === "ADMIN" ? "staff" : "admin"}`,
                          danger: false,
                        }}
                        action={() => updateTenantUserRole(u.id, u.role === "ADMIN" ? "STAFF" : "ADMIN")}
                      >
                        Make {u.role === "ADMIN" ? "staff" : "admin"}
                      </ActionButton>
                    ) : null}
                  </div>
                </TD>
                <TD label="Status">
                  <div className="flex flex-wrap gap-1 max-sm:justify-end">
                    <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Deactivated"}</Badge>
                    {locked ? (
                      <Badge tone="warning" title={`Too many failed sign-ins. Unlocks ${formatDate(u.lockedUntil, true)}.`}>
                        Locked
                      </Badge>
                    ) : null}
                  </div>
                </TD>
                <TD label="Last login" className="text-xs text-slate-500">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "Never"}
                </TD>
                {isOwner ? (
                  <TD label="Actions">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <ResetPasswordButton id={u.id} name={u.name} username={u.username} />
                      {locked && u.isActive ? (
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          confirm={{ title: `Unlock ${u.name}?`, message: "Clears the failed sign-in counter so they can try again with their current password.", confirmLabel: "Unlock", danger: false }}
                          action={() => unlockTenantUser(u.id)}
                        >
                          <LockOpen /> Unlock
                        </ActionButton>
                      ) : null}
                      {canModify ? (
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          confirm={
                            u.isActive
                              ? { title: `Deactivate ${u.name}?`, message: "They are signed out everywhere and cannot sign in until you activate them again. Nothing they created is deleted.", confirmLabel: "Deactivate" }
                              : { title: `Activate ${u.name}?`, message: "They can sign in again with their existing password. Any sign-in lock is cleared.", confirmLabel: "Activate", danger: false }
                          }
                          action={() => setTenantUserActive(u.id, !u.isActive)}
                        >
                          {u.isActive ? <UserX /> : <UserCheck />} {u.isActive ? "Deactivate" : "Activate"}
                        </ActionButton>
                      ) : null}
                      {canModify ? (
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${u.name}`}
                          confirm={{ title: `Remove ${u.name}?`, message: "They lose access immediately. Their past activity stays in the log. This cannot be undone.", confirmLabel: "Remove user" }}
                          action={() => deleteTenantUser(u.id)}
                        >
                          <Trash2 />
                        </ActionButton>
                      ) : null}
                      {!canModify ? <span className="text-xs text-slate-400">{me ? "Your account" : lastOwner ? "Only owner" : ""}</span> : null}
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
