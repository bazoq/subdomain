"use client";

/**
 * Client panels for /super/tenants/[id]: edit basics dialog, domains editor,
 * template changer, users panel and the danger zone.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Star, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch, Help } from "@/components/ui/input";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ActionButton } from "@/components/admin/action-button";
import { PasswordInput, CredentialReveal, generateClientPassword } from "@/components/admin/super/password-utils";
import {
  addDomain,
  addTenantUser,
  changeTemplate,
  deleteTenant,
  removeDomain,
  resetTenantUserPassword,
  setPrimaryDomain,
  toggleTenantUser,
  updateTenantBasics,
  type AddTenantUserInput,
  type HostnameEntry,
  type UpdateTenantBasicsInput,
} from "@/server/super/tenants-actions";
import type { TemplateOption } from "@/components/admin/super/tenant-form";
import { formatDate } from "@/lib/utils";

/* ---------------- edit basics ---------------- */

export function EditBasicsButton({ tenantId, initial }: { tenantId: string; initial: UpdateTenantBasicsInput }) {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await updateTenantBasics(tenantId, v);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit basics
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit website basics"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Business name" error={errors.name} required>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status}>
              <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as UpdateTenantBasicsInput["status"] })}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
            </Field>
            <div className="space-y-3 pt-7">
              <Switch checked={v.isDemo} onChange={(isDemo) => setV({ ...v, isDemo })} label="Demo website" />
              <Switch checked={v.urduEnabled} onChange={(urduEnabled) => setV({ ...v, urduEnabled })} label="Urdu enabled" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors["contact.phone"]}>
              <Input value={v.contact.phone} onChange={(e) => setV({ ...v, contact: { ...v.contact, phone: e.target.value } })} />
            </Field>
            <Field label="WhatsApp" error={errors["contact.whatsapp"]}>
              <Input value={v.contact.whatsapp} onChange={(e) => setV({ ...v, contact: { ...v.contact, whatsapp: e.target.value } })} />
            </Field>
            <Field label="Email" error={errors["contact.email"]}>
              <Input value={v.contact.email} onChange={(e) => setV({ ...v, contact: { ...v.contact, email: e.target.value } })} />
            </Field>
            <Field label="City" error={errors["contact.city"]}>
              <Input value={v.contact.city} onChange={(e) => setV({ ...v, contact: { ...v.contact, city: e.target.value } })} />
            </Field>
            <Field label="Address" error={errors["contact.address"]} className="sm:col-span-2">
              <Input value={v.contact.address} onChange={(e) => setV({ ...v, contact: { ...v.contact, address: e.target.value } })} />
            </Field>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/* ---------------- domains ---------------- */

export interface DomainRow {
  id: string;
  hostname: string;
  isPrimary: boolean;
  createdAt: string;
}

export function DomainsPanel({ tenantId, domains, rootDomain, hostUrlFor }: { tenantId: string; domains: DomainRow[]; rootDomain: string; hostUrlFor: Record<string, string> }) {
  const [entry, setEntry] = React.useState<HostnameEntry>({ kind: "subdomain", value: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function add() {
    setSaving(true);
    setError(null);
    const res = await addDomain(tenantId, entry);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Added");
      setEntry({ kind: entry.kind, value: "" });
      router.refresh();
    } else {
      setError(res.fieldErrors?.value ?? res.message);
      toast.push("error", res.message);
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <THead>
          <tr>
            <TH>Hostname</TH>
            <TH>Added</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {domains.map((d) => (
            <TR key={d.id}>
              <TD>
                <a href={hostUrlFor[d.hostname]} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:underline">
                  {d.hostname}
                </a>
                {d.isPrimary ? (
                  <Badge tone="brand" className="ml-2">
                    <Star className="size-3" /> primary
                  </Badge>
                ) : null}
              </TD>
              <TD className="text-xs text-slate-500">{formatDate(d.createdAt)}</TD>
              <TD>
                <div className="flex justify-end gap-2">
                  {!d.isPrimary ? (
                    <ActionButton size="sm" variant="ghost" action={() => setPrimaryDomain(tenantId, d.id)}>
                      Make primary
                    </ActionButton>
                  ) : null}
                  <ActionButton size="sm" variant="ghost" className="text-red-600" disabled={domains.length <= 1} confirm={`Remove ${d.hostname}? The site will stop responding on this hostname.`} action={() => removeDomain(tenantId, d.id)}>
                    <Trash2 />
                  </ActionButton>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-800">Add hostname</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select className="sm:w-44" value={entry.kind} onChange={(e) => setEntry({ kind: e.target.value as HostnameEntry["kind"], value: "" })}>
            <option value="subdomain">Subdomain</option>
            <option value="custom">Custom domain</option>
          </Select>
          {entry.kind === "subdomain" ? (
            <div className="flex flex-1 items-center">
              <Input value={entry.value} onChange={(e) => setEntry({ ...entry, value: e.target.value.toLowerCase() })} placeholder="my-shop" className="rounded-r-none" />
              <span className="flex h-10 items-center rounded-r-lg border border-l-0 border-slate-300 bg-white px-3 text-sm text-slate-600">.{rootDomain}</span>
            </div>
          ) : (
            <Input className="flex-1" value={entry.value} onChange={(e) => setEntry({ ...entry, value: e.target.value.toLowerCase() })} placeholder="www.example.pk" />
          )}
          <Button onClick={add} loading={saving} disabled={!entry.value}>
            <Plus /> Add
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
        <Help>Custom domains also need to be added to the Vercel project and pointed at Vercel by CNAME. See docs/DEPLOY.md.</Help>
      </div>
    </div>
  );
}

/* ---------------- template ---------------- */

export function TemplateChanger({ tenantId, currentId, options }: { tenantId: string; currentId: string; options: TemplateOption[] }) {
  const [selected, setSelected] = React.useState(currentId);
  const [query, setQuery] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const router = useRouter();
  const target = options.find((o) => o.id === selected);
  const q = query.trim().toLowerCase();
  const visible = options.filter((o) => o.id === selected || !q || String(o.code).includes(q) || o.name.toLowerCase().includes(q) || o.id.includes(q));

  async function apply() {
    if (!target || selected === currentId) return;
    if (!window.confirm(`Switch to "${target.name}"? Sections that do not exist in the new template will be removed; matching sections keep their content.`)) return;
    setSaving(true);
    const res = await changeTemplate(tenantId, selected);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Template changed");
      router.refresh();
    } else toast.push("error", res.message);
  }

  if (options.length <= 1) return <p className="text-sm text-slate-500">No other templates are available in this category.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name or #code" className="sm:w-48" />
        <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="sm:max-w-sm">
          {visible.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.code} {o.name} ({o.id}){o.id === currentId ? " — current" : ""}
            </option>
          ))}
        </Select>
        <Button onClick={apply} loading={saving} disabled={selected === currentId} variant="outline">
          Change template
        </Button>
      </div>
      {selected !== currentId ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Heads up:</strong> content of sections with matching keys is kept; sections only present in the old template are deleted; new sections get the template&apos;s default content. Review the site after switching.
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- users ---------------- */

export interface TenantUserRow {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
  lastLoginAt: string | null;
}

const emptyUser: AddTenantUserInput = { name: "", username: "", email: "", password: "", role: "ADMIN" };

export function UsersPanel({ tenantId, users }: { tenantId: string; users: TenantUserRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState<AddTenantUserInput>({ ...emptyUser, password: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [reveal, setReveal] = React.useState<{ username: string; password: string } | null>(null);
  const toast = useToast();
  const router = useRouter();

  function openDialog() {
    setV({ ...emptyUser, password: generateClientPassword() });
    setErrors({});
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const res = await addTenantUser(tenantId, v);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Added");
      setOpen(false);
      setReveal({ username: v.username.toLowerCase(), password: v.password });
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  async function reset(u: TenantUserRow) {
    if (!window.confirm(`Generate a new password for ${u.username}? They will be signed out everywhere.`)) return;
    const password = generateClientPassword();
    const res = await resetTenantUserPassword(tenantId, u.id, password);
    if (res.ok) {
      toast.push("success", res.message ?? "Password reset");
      setReveal({ username: u.username, password });
    } else toast.push("error", res.message);
  }

  return (
    <div className="space-y-4">
      {reveal ? (
        <CredentialReveal
          title="New credentials"
          lines={[
            { label: "Username", value: reveal.username },
            { label: "Password", value: reveal.password },
          ]}
        />
      ) : null}
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
                <p className="font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">
                  {u.username}
                  {u.email ? ` · ${u.email}` : ""}
                </p>
              </TD>
              <TD>
                <Badge tone={u.role === "OWNER" ? "purple" : u.role === "ADMIN" ? "info" : "default"}>{u.role}</Badge>
              </TD>
              <TD>
                <StatusBadge status={u.isActive ? "ACTIVE" : "SUSPENDED"} />
              </TD>
              <TD className="text-xs text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}</TD>
              <TD>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => reset(u)}>
                    <KeyRound /> Reset password
                  </Button>
                  <ActionButton size="sm" variant="ghost" action={() => toggleTenantUser(tenantId, u.id, !u.isActive)}>
                    {u.isActive ? "Deactivate" : "Activate"}
                  </ActionButton>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <Button variant="outline" onClick={openDialog}>
        <UserPlus /> Add user
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add tenant user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Add user
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} required>
              <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
            </Field>
            <Field label="Username" error={errors.username} required>
              <Input value={v.username} autoComplete="off" onChange={(e) => setV({ ...v, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })} />
            </Field>
            <Field label="Email (optional)" error={errors.email}>
              <Input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
            </Field>
            <Field label="Role" error={errors.role}>
              <Select value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as AddTenantUserInput["role"] })}>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
              </Select>
            </Field>
          </div>
          <Field label="Password" error={errors.password} required>
            <PasswordInput value={v.password} onChange={(password) => setV({ ...v, password })} />
            <Help>Shown once after saving.</Help>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

/* ---------------- danger zone ---------------- */

export function DangerZone({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  async function destroy() {
    setBusy(true);
    const res = await deleteTenant(tenantId, typed);
    setBusy(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Deleted");
      router.push("/super/tenants");
    } else toast.push("error", res.message);
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <p className="text-sm font-semibold text-red-800">Delete this website</p>
      <p className="mt-1 text-xs text-red-700">Permanently removes the website, its users, content, orders, leads and uploaded files. This cannot be undone.</p>
      <Button variant="danger" className="mt-3" onClick={() => setOpen(true)}>
        <Trash2 /> Delete website
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete website"
        description={`Type "${tenantName}" to confirm.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={destroy} loading={busy} disabled={typed.trim() !== tenantName}>
              Delete permanently
            </Button>
          </>
        }
      >
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={tenantName} autoFocus />
      </Dialog>
    </div>
  );
}
