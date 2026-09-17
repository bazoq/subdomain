"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { changeOwnPassword, createTenantUser, resetTenantUserPassword, suggestPassword, type CreateUserInput } from "@/modules/shared/users-actions";
import { idle } from "@/lib/action-result";

function PasswordReveal({ username, password }: { username?: string; password: string }) {
  const [copied, setCopied] = React.useState(false);
  const text = username ? `Username: ${username}\nPassword: ${password}` : password;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-medium text-emerald-800">Share these details now – the password will not be shown again.</p>
      <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 font-mono text-sm text-slate-900">{text}</pre>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

const empty: CreateUserInput = { name: "", username: "", email: "", role: "STAFF", password: "" };

export function AddUserButton() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<CreateUserInput>(empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [created, setCreated] = React.useState<{ username: string; password: string } | null>(null);
  const toast = useToast();
  const router = useRouter();

  async function generate() {
    const res = await suggestPassword();
    if (res.ok && res.data) setValue((v) => ({ ...v, password: res.data!.password }));
  }
  async function save() {
    setSaving(true);
    const res = await createTenantUser(value);
    setSaving(false);
    if (res.ok && res.data) {
      toast.push("success", "User added.");
      setCreated({ username: value.username.toLowerCase(), password: res.data.password });
      setErrors({});
      router.refresh();
    } else if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }
  function close() {
    setOpen(false);
    setCreated(null);
    setValue(empty);
    setErrors({});
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add user
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={created ? "User created" : "Add user"}
        description={created ? undefined : "Staff can manage orders and content but cannot change users or settings."}
        footer={
          created ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                Create user
              </Button>
            </>
          )
        }
      >
        {created ? (
          <PasswordReveal username={created.username} password={created.password} />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} placeholder="e.g. Bilal Ahmed" />
              </Field>
              <Field label="Username" error={errors.username} required help="Lowercase letters, numbers, dot or dash.">
                <Input value={value.username} autoCapitalize="none" onChange={(e) => setValue({ ...value, username: e.target.value.toLowerCase().replace(/\s+/g, "") })} placeholder="bilal" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email (optional)" error={errors.email}>
                <Input type="email" value={value.email ?? ""} onChange={(e) => setValue({ ...value, email: e.target.value })} />
              </Field>
              <Field label="Role" error={errors.role}>
                <Select value={value.role} onChange={(e) => setValue({ ...value, role: e.target.value as CreateUserInput["role"] })}>
                  <option value="STAFF">Staff – orders, leads, content</option>
                  <option value="ADMIN">Admin – everything except users</option>
                </Select>
              </Field>
            </div>
            <Field label="Password" error={errors.password} help="Leave blank to generate a strong password. At least 8 characters with letters and numbers.">
              <div className="flex gap-2">
                <Input value={value.password ?? ""} autoComplete="new-password" onChange={(e) => setValue({ ...value, password: e.target.value })} className="font-mono" />
                <Button type="button" variant="outline" onClick={generate} title="Generate">
                  <RefreshCw /> Generate
                </Button>
              </div>
            </Field>
          </div>
        )}
      </Dialog>
    </>
  );
}

export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [pw, setPw] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  async function reset() {
    setSaving(true);
    const res = await resetTenantUserPassword(id, pw);
    setSaving(false);
    if (res.ok && res.data) {
      setResult(res.data.password);
      router.refresh();
    } else if (!res.ok) toast.push("error", res.message);
  }
  function close() {
    setOpen(false);
    setResult(null);
    setPw("");
  }
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Reset password">
        <KeyRound /> Reset password
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={`Reset password for ${name}`}
        footer={
          result ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={reset} loading={saving}>
                Reset
              </Button>
            </>
          )
        }
      >
        {result ? (
          <PasswordReveal password={result} />
        ) : (
          <Field label="New password" help="Leave blank to generate one. The user will be signed out everywhere.">
            <Input value={pw} autoComplete="new-password" onChange={(e) => setPw(e.target.value)} className="font-mono" />
          </Field>
        )}
      </Dialog>
    </>
  );
}

/** Any user changes their own password. */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, idle);
  const formRef = React.useRef<HTMLFormElement>(null);
  const toast = useToast();
  React.useEffect(() => {
    if (state.ok) {
      toast.push("success", state.message ?? "Password changed.");
      formRef.current?.reset();
    }
  }, [state, toast]);
  const err = (k: string) => (!state.ok ? state.fieldErrors?.[k] : undefined);
  return (
    <form ref={formRef} action={action} className="max-w-md space-y-4">
      {!state.ok && state.message && !state.fieldErrors ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p> : null}
      <Field label="Current password" error={err("current")} required>
        <Input type="password" name="current" autoComplete="current-password" required />
      </Field>
      <Field label="New password" error={err("password")} required help="At least 8 characters with letters and numbers.">
        <Input type="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Confirm new password" error={err("confirm")} required>
        <Input type="password" name="confirm" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
