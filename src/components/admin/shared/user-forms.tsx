"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, PasswordInput, PasswordStrength, passwordPolicyMessage, PASSWORD_MIN } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { changeOwnPassword, createTenantUser, resetTenantUserPassword, suggestPassword, type CreateUserInput } from "@/modules/shared/users-actions";
import { idle } from "@/lib/action-result";

const PASSWORD_HELP = `At least ${PASSWORD_MIN} characters with letters and numbers. Not something common, and not your username.`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[a-z0-9_.-]{3,30}$/;

function PasswordReveal({ username, password }: { username?: string; password: string }) {
  const [copied, setCopied] = React.useState(false);
  const text = username ? `Username: ${username}\nPassword: ${password}` : password;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4" role="status">
      <p className="text-sm font-medium text-emerald-800">Share these details now – the password will not be shown again.</p>
      <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 font-mono text-sm text-slate-900" aria-label="New sign-in details">
        {text}
      </pre>
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
            /* clipboard unavailable: the text is selectable above */
          }
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function focusFirstInvalid(root: HTMLElement | null) {
  root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

const empty: CreateUserInput = { name: "", username: "", email: "", role: "STAFF", password: "" };

function validateCreate(v: CreateUserInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = "Enter the person's name";
  if (!USERNAME.test(v.username)) e.username = v.username.length < 3 ? "At least 3 characters" : "Only lowercase letters, numbers, dot, dash and underscore";
  if (v.email && !EMAIL.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.password) {
    const msg = passwordPolicyMessage(v.password, { username: v.username });
    if (msg) e.password = msg;
  }
  return e;
}

export function AddUserButton() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<CreateUserInput>(empty);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [created, setCreated] = React.useState<{ username: string; password: string } | null>(null);
  const toast = useToast();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const formId = React.useId();

  function edit(patch: Partial<CreateUserInput>) {
    setValue((v) => ({ ...v, ...patch }));
    const k = Object.keys(patch)[0];
    if (k && errors[k]) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)));
  }

  async function generate() {
    const res = await suggestPassword();
    if (res.ok && res.data) edit({ password: res.data.password });
    else toast.push("error", "Could not generate a password. Type one instead.");
  }

  async function save() {
    const clientErrors = validateCreate(value);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    setSaving(true);
    let res: Awaited<ReturnType<typeof createTenantUser>>;
    try {
      res = await createTenantUser({ ...value, name: value.name.trim(), email: value.email?.trim() });
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not add the user. Try again." };
    }
    setSaving(false);
    if (res.ok && res.data) {
      toast.push("success", "User added.");
      setCreated({ username: value.username.toLowerCase(), password: res.data.password });
      setErrors({});
      router.refresh();
    } else if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
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
            <Button type="button" onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form={formId} loading={saving}>
                Create user
              </Button>
            </>
          )
        }
      >
        {created ? (
          <PasswordReveal username={created.username} password={created.password} />
        ) : (
          <form
            id={formId}
            ref={formRef}
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <Input value={value.name} autoComplete="off" onChange={(e) => edit({ name: e.target.value })} placeholder="e.g. Bilal Ahmed" />
              </Field>
              <Field label="Username" error={errors.username} required help="3–30 lowercase letters, numbers, dot, dash or underscore.">
                <Input value={value.username} autoCapitalize="none" autoComplete="off" spellCheck={false} onChange={(e) => edit({ username: e.target.value.toLowerCase().replace(/\s+/g, "") })} placeholder="bilal" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email (optional)" error={errors.email}>
                <Input type="email" inputMode="email" autoCapitalize="none" autoComplete="off" value={value.email ?? ""} onChange={(e) => edit({ email: e.target.value })} />
              </Field>
              <Field label="Role" error={errors.role}>
                <Select value={value.role} onChange={(e) => edit({ role: e.target.value as CreateUserInput["role"] })}>
                  <option value="STAFF">Staff – orders, leads, content</option>
                  <option value="ADMIN">Admin – everything except users</option>
                </Select>
              </Field>
            </div>
            <div>
              <Field label="Password" error={errors.password} help={`Leave blank to generate a strong password. ${PASSWORD_HELP}`}>
                <PasswordInput value={value.password ?? ""} autoComplete="new-password" spellCheck={false} onChange={(e) => edit({ password: e.target.value })} className="font-mono" />
              </Field>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                <PasswordStrength value={value.password ?? ""} username={value.username} className="mt-0 min-w-[12rem] flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={generate}>
                  <RefreshCw /> Generate
                </Button>
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

export function ResetPasswordButton({ id, name, username }: { id: string; name: string; username?: string }) {
  const [open, setOpen] = React.useState(false);
  const [pw, setPw] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const formId = React.useId();

  async function reset() {
    const trimmed = pw.trim();
    if (trimmed) {
      const msg = passwordPolicyMessage(trimmed, { username });
      if (msg) {
        setError(msg);
        return;
      }
    }
    setSaving(true);
    let res: Awaited<ReturnType<typeof resetTenantUserPassword>>;
    try {
      res = await resetTenantUserPassword(id, trimmed || undefined);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not reset the password. Try again." };
    }
    setSaving(false);
    if (res.ok && res.data) {
      setResult(res.data.password);
      router.refresh();
    } else if (!res.ok) {
      setError(res.message);
      toast.push("error", res.message);
    }
  }
  function close() {
    setOpen(false);
    setResult(null);
    setPw("");
    setError(undefined);
  }
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Reset password for ${name}`}>
        <KeyRound /> Reset password
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={`Reset password for ${name}`}
        description={result ? undefined : "They will be signed out on every device and must use the new password."}
        footer={
          result ? (
            <Button type="button" onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form={formId} loading={saving}>
                Reset password
              </Button>
            </>
          )
        }
      >
        {result ? (
          <PasswordReveal password={result} />
        ) : (
          <form
            id={formId}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void reset();
            }}
          >
            <Field label="New password" error={error} help={`Leave blank to generate one. ${PASSWORD_HELP}`}>
              <PasswordInput
                value={pw}
                autoComplete="new-password"
                spellCheck={false}
                autoFocus
                onChange={(e) => {
                  setPw(e.target.value);
                  setError(undefined);
                }}
                className="font-mono"
              />
            </Field>
            <PasswordStrength value={pw} username={username} />
          </form>
        )}
      </Dialog>
    </>
  );
}

/** Any user changes their own password. */
export function ChangePasswordForm({ username }: { username?: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pw, setPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [clientErrors, setClientErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  // success handling lives in the action wrapper (not an effect): clear fields + announce once
  const [state, action, pending] = useActionState(async (prev: Parameters<typeof changeOwnPassword>[0], fd: FormData) => {
    const res = await changeOwnPassword(prev, fd);
    if (res.ok) {
      toast.push("success", res.message ?? "Password changed.");
      formRef.current?.reset();
      setPw("");
      setConfirm("");
    }
    return res;
  }, idle);

  const err = (k: string) => clientErrors[k] ?? (!state.ok ? state.fieldErrors?.[k] : undefined);
  const policy = pw ? passwordPolicyMessage(pw, { username }) : null;

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        const errs: Record<string, string> = {};
        if (policy) errs.password = policy;
        if (confirm !== pw) errs.confirm = "Passwords do not match";
        if (Object.keys(errs).length) {
          e.preventDefault();
          setClientErrors(errs);
          requestAnimationFrame(() => focusFirstInvalid(formRef.current));
          return;
        }
        setClientErrors({});
      }}
    >
      {!state.ok && state.message && !state.fieldErrors ? <Alert tone="danger">{state.message}</Alert> : null}
      <Field label="Current password" error={err("current")} required>
        <PasswordInput name="current" autoComplete="current-password" required />
      </Field>
      <Field label="New password" error={err("password")} required help={PASSWORD_HELP}>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            if (clientErrors.password) setClientErrors((c) => ({ ...c, password: "" }));
          }}
        />
      </Field>
      <PasswordStrength value={pw} username={username} className="-mt-2" />
      <Field label="Confirm new password" error={err("confirm")} required>
        <PasswordInput
          name="confirm"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (clientErrors.confirm) setClientErrors((c) => ({ ...c, confirm: "" }));
          }}
        />
      </Field>
      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
