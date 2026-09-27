"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Help } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionButton } from "@/components/admin/action-button";
import { PasswordInput, CredentialReveal, generateClientPassword, PASSWORD_MIN } from "@/components/admin/super/password-utils";
import { changeOwnPassword, createSuperUser, resetSuperUserPassword, toggleSuperUser, type CreateSuperUserInput } from "@/server/super/users-actions";
import { idle, type ActionResult } from "@/lib/action-result";

const empty: CreateSuperUserInput = { name: "", username: "", email: "", password: "", role: "EDITOR" };

export function AddSuperUserButton() {
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState<CreateSuperUserInput>(empty);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [reveal, setReveal] = React.useState<{ username: string; password: string } | null>(null);
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await createSuperUser(v);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Created");
      setReveal({ username: v.username.toLowerCase(), password: v.password });
      setOpen(false);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setV({ ...empty, password: generateClientPassword() });
          setErrors({});
          setOpen(true);
        }}
      >
        <UserPlus /> Add super user
      </Button>
      {reveal ? (
        <Dialog open onClose={() => setReveal(null)} title="Credentials" footer={<Button onClick={() => setReveal(null)}>Done</Button>}>
          <CredentialReveal
            title="New super user"
            lines={[
              { label: "Username", value: reveal.username },
              { label: "Password", value: reveal.password },
            ]}
          />
        </Dialog>
      ) : null}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add super user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Create
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
            <Field label="Email" error={errors.email} required>
              <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            </Field>
            <Field label="Role" error={errors.role}>
              <Select value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as CreateSuperUserInput["role"] })}>
                <option value="SUPERADMIN">Super admin (full access)</option>
                <option value="EDITOR">Editor (blog, leads)</option>
              </Select>
            </Field>
          </div>
          <Field label="Password" error={errors.password} required>
            <PasswordInput value={v.password} onChange={(password) => setV({ ...v, password })} />
            <Help>At least {PASSWORD_MIN} characters with letters and numbers. Shown once after creation.</Help>
          </Field>
        </div>
      </Dialog>
    </>
  );
}

export function SuperUserRowActions({ id, username, isActive, isSelf, canManage }: { id: string; username: string; isActive: boolean; isSelf: boolean; canManage: boolean }) {
  const [reveal, setReveal] = React.useState<string | null>(null);
  const toast = useToast();
  if (!canManage) return null;

  async function reset() {
    if (!window.confirm(`Generate a new password for ${username}?`)) return;
    const password = generateClientPassword();
    const res = await resetSuperUserPassword(id, password);
    if (res.ok) {
      toast.push("success", res.message ?? "Reset");
      setReveal(password);
    } else toast.push("error", res.message);
  }

  return (
    <div className="flex justify-end gap-2">
      {reveal ? (
        <Dialog open onClose={() => setReveal(null)} title="New password" footer={<Button onClick={() => setReveal(null)}>Done</Button>}>
          <CredentialReveal
            title={`Password for ${username}`}
            lines={[
              { label: "Username", value: username },
              { label: "Password", value: reveal },
            ]}
          />
        </Dialog>
      ) : null}
      <Button size="sm" variant="ghost" onClick={reset}>
        <KeyRound /> Reset password
      </Button>
      {!isSelf ? (
        <ActionButton size="sm" variant="ghost" action={() => toggleSuperUser(id, !isActive)}>
          {isActive ? "Deactivate" : "Activate"}
        </ActionButton>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(changeOwnPassword, idle);
  const toast = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => {
    if (state.ok) {
      toast.push("success", state.message ?? "Password changed");
      formRef.current?.reset();
    }
  }, [state, toast]);
  const errors = !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-4">
      <Field label="Current password" error={errors.current} required>
        <Input type="password" name="current" autoComplete="current-password" required />
      </Field>
      <Field label="New password" error={errors.password} required help={`At least ${PASSWORD_MIN} characters with letters and numbers; not a common password or your username.`}>
        <Input type="password" name="password" autoComplete="new-password" required minLength={PASSWORD_MIN} />
      </Field>
      <Field label="Confirm new password" error={errors.confirm} required>
        <Input type="password" name="confirm" autoComplete="new-password" required />
      </Field>
      {!state.ok && state.message && !Object.keys(errors).length ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}
      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
