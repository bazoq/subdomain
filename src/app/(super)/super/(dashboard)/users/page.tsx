import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requireSuperPage } from "@/server/super/access";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddSuperUserButton, SuperUserRowActions } from "@/components/admin/super/super-users";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Super users" };

export default async function SuperUsersPage() {
  const me = await requireSuperPage(["SUPERADMIN"]);
  const users = await db.superUser.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
  const canManage = me.role === "SUPERADMIN";
  return (
    <>
      <PageHeader
        title="Super users"
        description="People who can sign in to this control panel."
        actions={
          <>
            <Link href="/super/users/password">
              <Button variant="outline">
                <KeyRound /> Change my password
              </Button>
            </Link>
            {canManage ? <AddSuperUserButton /> : null}
          </>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Status</TH>
            <TH>Last login</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD>
                <p className="font-medium text-slate-900">
                  {u.name}
                  {u.id === me.id ? <span className="ml-2 text-xs text-slate-500">(you)</span> : null}
                </p>
                <p className="text-xs text-slate-500">
                  {u.username} · {u.email}
                </p>
              </TD>
              <TD>
                <Badge tone={u.role === "SUPERADMIN" ? "purple" : "info"}>{u.role}</Badge>
              </TD>
              <TD>
                <StatusBadge status={u.isActive ? "ACTIVE" : "SUSPENDED"} />
                {u.lockedUntil && u.lockedUntil > new Date() ? <p className="mt-0.5 text-[11px] text-red-600">locked until {formatDate(u.lockedUntil, true)}</p> : null}
              </TD>
              <TD className="text-xs text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}</TD>
              <TD>
                <SuperUserRowActions id={u.id} username={u.username} isActive={u.isActive} isSelf={u.id === me.id} canManage={canManage} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
