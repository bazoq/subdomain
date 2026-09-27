"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { Field as FieldDef } from "@/templates/fields";
import { fieldsSchema } from "@/templates/fields";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select, Help, Switch, FieldError } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useConfirm } from "@/components/ui/dialog";
import { ImageField, ImagesField } from "@/components/admin/uploader";
import { MediaPickerButton } from "@/components/admin/shared/media-picker";
import { useToast } from "@/components/ui/toast";
import { saveSection, resetSection } from "@/server/content/actions";
import { cn } from "@/lib/utils";

type Value = Record<string, unknown>;
/** dotted path ("items.0.title.en") → message */
export type FieldErrors = Record<string, string>;

function emptyFor(f: FieldDef): unknown {
  switch (f.type) {
    case "text":
    case "color":
    case "image":
    case "icon":
      return "";
    case "select":
      return f.options[0]?.value ?? "";
    case "localized":
    case "richtext":
      return { en: "" };
    case "number":
      return 0;
    case "boolean":
      return false;
    case "images":
      return [];
    case "link":
      return { label: { en: "" }, href: "" };
    case "repeater":
      return [];
  }
}

/* ---------- validation ---------- */

type Issue = { code: string; message: string; path: PropertyKey[]; maximum?: number | bigint; minimum?: number | bigint; origin?: string };

function friendly(i: Issue): string {
  switch (i.code) {
    case "too_big":
      if (i.origin === "string") return `Too long (max ${i.maximum} characters)`;
      if (i.origin === "array") return `Too many items (max ${i.maximum})`;
      return `Must be ${i.maximum} or less`;
    case "too_small":
      if (i.origin === "string") return Number(i.minimum) <= 1 ? "Required" : `At least ${i.minimum} characters`;
      if (i.origin === "array") return `Add at least ${i.minimum} item${Number(i.minimum) === 1 ? "" : "s"}`;
      return `Must be ${i.minimum} or more`;
    case "invalid_type":
      return "Required";
    case "invalid_format":
      return "Use a hex colour like #1A2B3C, or leave blank";
    default:
      return i.message;
  }
}

/** Runs the same zod schema the server uses and returns per-path messages. */
export function validateFields(fields: FieldDef[], value: Value): FieldErrors {
  const parsed = fieldsSchema(fields).safeParse(value);
  if (parsed.success) return {};
  const out: FieldErrors = {};
  for (const raw of parsed.error.issues as unknown as Issue[]) {
    const key = raw.path.map(String).join(".");
    if (!out[key]) out[key] = friendly(raw);
  }
  return out;
}

function focusFirstInvalid(root: HTMLElement | null) {
  const el = root?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.focus({ preventScroll: true });
}

/* ---------- editor ---------- */

export function SectionEditor({
  sectionKey,
  label,
  description,
  fields,
  initial,
  urduEnabled,
}: {
  sectionKey: string;
  label: string;
  description?: string;
  fields: FieldDef[];
  initial: Value;
  urduEnabled: boolean;
}) {
  const [value, setValue] = React.useState<Value>(initial);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [attempt, setAttempt] = React.useState(0);
  const rootRef = React.useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm();

  // warn before leaving with unsaved changes (tab close / reload; in-app links are soft-navigations)
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function update(next: Value) {
    setValue(next);
    setDirty(true);
  }

  async function onSave() {
    const clientErrors = validateFields(fields, value);
    setAttempt((a) => a + 1);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      toast.push("error", `Please fix ${Object.keys(clientErrors).length} field${Object.keys(clientErrors).length === 1 ? "" : "s"} before saving.`);
      requestAnimationFrame(() => focusFirstInvalid(rootRef.current));
      return;
    }
    setErrors({});
    setSaving(true);
    let res: Awaited<ReturnType<typeof saveSection>>;
    try {
      res = await saveSection(sectionKey, value);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not save. Check your connection and try again." };
    }
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setDirty(false);
      router.refresh();
    } else {
      if (res.fieldErrors && Object.keys(res.fieldErrors).length) {
        setErrors(res.fieldErrors);
        requestAnimationFrame(() => focusFirstInvalid(rootRef.current));
      }
      toast.push("error", res.message);
    }
  }

  async function onReset() {
    const ok = await confirm({
      title: "Reset this section?",
      message: "The section goes back to the template's default content. Your custom text and images for this section will be lost.",
      confirmLabel: "Reset section",
    });
    if (!ok) return;
    const res = await resetSection(sectionKey);
    if (res.ok) {
      toast.push("success", res.message ?? "Reset");
      setDirty(false);
      setErrors({});
      router.refresh();
    } else toast.push("error", res.message);
  }

  const known = new Set(fields.map((f) => f.key));
  const orphanErrors = Object.entries(errors).filter(([k]) => !known.has(k.split(".")[0] ?? ""));
  const errorCount = Object.keys(errors).length;

  return (
    <form
      ref={rootRef}
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        {orphanErrors.length ? (
          <Alert tone="danger" title="Could not save" className="mt-4">
            <ul className="list-disc pl-4">
              {orphanErrors.map(([k, v]) => (
                <li key={k}>
                  {k || "Section"}: {v}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
        <div className="mt-5 space-y-5">
          <FieldsForm fields={fields} value={value} onChange={update} urduEnabled={urduEnabled} errors={errors} attempt={attempt} />
        </div>
      </div>
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <Button type="button" variant="ghost" onClick={onReset} disabled={saving}>
          Reset to default
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs" role="status" aria-live="polite">
            {errorCount ? (
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertCircle className="size-3.5" aria-hidden="true" /> {errorCount} field{errorCount === 1 ? "" : "s"} need attention
              </span>
            ) : dirty ? (
              <span className="text-amber-600">Unsaved changes</span>
            ) : null}
          </span>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
      {confirmDialog}
    </form>
  );
}

/* ---------- schema-driven form ---------- */

export function FieldsForm({
  fields,
  value,
  onChange,
  urduEnabled,
  compact,
  errors = {},
  path = "",
  attempt = 0,
}: {
  fields: FieldDef[];
  value: Value;
  onChange: (v: Value) => void;
  urduEnabled: boolean;
  compact?: boolean;
  /** dotted-path errors from `validateFields` or the server's `fieldErrors` */
  errors?: FieldErrors;
  /** path prefix for nested (repeater) values */
  path?: string;
  /** bumps after each save attempt so collapsed repeater items re-evaluate their open state */
  attempt?: number;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <>
      {fields.map((f) => (
        <FieldControl
          key={f.key}
          field={f}
          path={path ? `${path}.${f.key}` : f.key}
          value={value[f.key] ?? emptyFor(f)}
          onChange={(v) => set(f.key, v)}
          urduEnabled={urduEnabled}
          compact={compact}
          errors={errors}
          attempt={attempt}
        />
      ))}
    </>
  );
}

function FieldControl({
  field: f,
  path,
  value,
  onChange,
  urduEnabled,
  compact,
  errors,
  attempt,
}: {
  field: FieldDef;
  path: string;
  value: unknown;
  onChange: (v: unknown) => void;
  urduEnabled: boolean;
  compact?: boolean;
  errors: FieldErrors;
  attempt: number;
}) {
  const id = React.useId();
  const err = errors[path];
  switch (f.type) {
    case "text":
      return (
        <Field label={f.label} help={f.help} error={err}>
          <Input value={(value as string) ?? ""} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "localized":
    case "richtext": {
      const v = (value as { en: string; ur?: string }) ?? { en: "" };
      const multi = f.type === "richtext" || (f.type === "localized" && f.multiline);
      const Cmp = multi ? Textarea : Input;
      const enErr = err ?? errors[`${path}.en`];
      const urErr = errors[`${path}.ur`];
      const maxLength = f.type === "localized" ? f.maxLength : undefined;
      return (
        <div className={cn("grid gap-3", urduEnabled && "md:grid-cols-2")}>
          <Field
            label={f.label}
            error={enErr}
            help={
              f.type === "richtext" ? (
                <>
                  {f.help ? <>{f.help} </> : null}Plain text or simple markdown (blank line = new paragraph, &quot;- &quot; = bullet).
                </>
              ) : (
                f.help
              )
            }
          >
            <Cmp value={v.en ?? ""} maxLength={maxLength} onChange={(e) => onChange({ ...v, en: e.target.value })} className={f.type === "richtext" ? "min-h-[140px]" : undefined} />
          </Field>
          {urduEnabled ? (
            <div dir="rtl">
              <Field label={`${f.label} (اردو)`} error={urErr} help={f.type === "richtext" ? "اردو متن یہاں لکھیں (اختیاری)۔" : undefined}>
                <Cmp lang="ur" dir="rtl" value={v.ur ?? ""} maxLength={maxLength} onChange={(e) => onChange({ ...v, ur: e.target.value })} className={cn("font-urdu", f.type === "richtext" && "min-h-[140px]")} />
              </Field>
            </div>
          ) : null}
        </div>
      );
    }
    case "number":
      return (
        <Field label={f.label} help={f.help} error={err}>
          <Input type="number" inputMode="numeric" min={f.min} max={f.max} value={(value as number) ?? 0} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
        </Field>
      );
    case "boolean":
      return (
        <div>
          <Switch checked={Boolean(value)} onChange={onChange} label={f.label} description={f.help} />
          <FieldError>{err}</FieldError>
        </div>
      );
    case "select":
      return (
        <Field label={f.label} help={f.help} error={err}>
          <Select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "color":
      return (
        <Field label={f.label} help={f.help} error={err} htmlFor={id}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test((value as string) ?? "") ? (value as string) : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-slate-300"
              aria-label={`${f.label} colour picker`}
            />
            <Input
              id={id}
              value={(value as string) ?? ""}
              placeholder="#RRGGBB (blank = template default)"
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${id}-error` : f.help ? `${id}-help` : undefined}
              spellCheck={false}
              autoCapitalize="none"
            />
          </div>
        </Field>
      );
    case "image": {
      const url = (value as string) ?? "";
      return (
        <div role="group" aria-labelledby={`${id}-label`} data-invalid={err ? "true" : undefined} tabIndex={err ? -1 : undefined}>
          <p id={`${id}-label`} className="mb-1.5 text-sm font-medium text-slate-700">
            {f.label}
          </p>
          <ImageField value={url} onChange={onChange} folder="sections" className={compact ? "max-w-xs" : "max-w-md"} />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <MediaPickerButton onPick={(urls) => urls[0] && onChange(urls[0])} exclude={url ? [url] : []}>
              {url ? "Replace from library" : "Choose from library"}
            </MediaPickerButton>
          </div>
          {err ? <FieldError>{err}</FieldError> : f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    }
    case "images": {
      const urls = (value as string[]) ?? [];
      const max = f.max ?? 12;
      return (
        <div role="group" aria-labelledby={`${id}-label`} data-invalid={err ? "true" : undefined} tabIndex={err ? -1 : undefined}>
          <p id={`${id}-label`} className="mb-1.5 text-sm font-medium text-slate-700">
            {f.label} <span className="text-xs font-normal text-slate-400">({urls.length} / {max})</span>
          </p>
          <ImagesField value={urls} onChange={onChange} folder="sections" max={max} />
          {urls.length < max ? (
            <div className="mt-1.5">
              <MediaPickerButton multiple max={max - urls.length} exclude={urls} onPick={(picked) => onChange([...urls, ...picked].slice(0, max))}>
                Add from library
              </MediaPickerButton>
            </div>
          ) : null}
          {err ? <FieldError>{err}</FieldError> : f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    }
    case "link": {
      const v = (value as { label: { en: string; ur?: string }; href: string }) ?? { label: { en: "" }, href: "" };
      const hrefErr = errors[`${path}.href`];
      const labelErr = errors[`${path}.label`] ?? errors[`${path}.label.en`];
      return (
        <fieldset className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">{f.label}</legend>
          <div className={cn("grid gap-3", urduEnabled ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <Field label="Button text" error={labelErr}>
              <Input value={v.label?.en ?? ""} onChange={(e) => onChange({ ...v, label: { ...v.label, en: e.target.value } })} />
            </Field>
            {urduEnabled ? (
              <div dir="rtl">
                <Field label="Button text (اردو)" error={errors[`${path}.label.ur`]}>
                  <Input lang="ur" dir="rtl" className="font-urdu" value={v.label?.ur ?? ""} onChange={(e) => onChange({ ...v, label: { ...v.label, ur: e.target.value } })} />
                </Field>
              </div>
            ) : null}
            <Field label="Link" error={hrefErr ?? err} help={f.help ?? 'Use "whatsapp" or "tel" to link to your WhatsApp / phone from Settings.'}>
              <Input value={v.href ?? ""} placeholder="/shop, #about, https://…, whatsapp, tel" onChange={(e) => onChange({ ...v, href: e.target.value })} autoCapitalize="none" spellCheck={false} />
            </Field>
          </div>
        </fieldset>
      );
    }
    case "icon":
      return (
        <Field
          label={f.label}
          error={err}
          help={
            <>
              Any icon name from{" "}
              <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">
                lucide.dev/icons
              </a>
              <span className="sr-only"> (opens in a new tab)</span>.
            </>
          }
        >
          <Input value={(value as string) ?? ""} placeholder="Lucide icon name, e.g. Truck" onChange={(e) => onChange(e.target.value)} autoCapitalize="none" spellCheck={false} />
        </Field>
      );
    case "repeater":
      return <RepeaterField field={f} path={path} items={(value as Value[]) ?? []} onChange={(items) => onChange(items)} urduEnabled={urduEnabled} errors={errors} attempt={attempt} err={err} />;
  }
}

/* ---------- repeater ---------- */

let seq = 0;
const newKey = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;

function RepeaterField({
  field: f,
  path,
  items,
  onChange,
  urduEnabled,
  errors,
  attempt,
  err,
}: {
  field: Extract<FieldDef, { type: "repeater" }>;
  path: string;
  items: Value[];
  onChange: (items: Value[]) => void;
  urduEnabled: boolean;
  errors: FieldErrors;
  attempt: number;
  err?: string;
}) {
  // stable React keys that follow items through add/remove/move (index keys would remount rows and lose focus)
  const [keys, setKeys] = React.useState<string[]>(() => items.map(newKey));
  const [lastAdded, setLastAdded] = React.useState<string | null>(null);
  const keyAt = (i: number) => keys[i] ?? `i${i}`;
  const listId = React.useId();
  const atMax = f.max != null && items.length >= f.max;

  function add() {
    if (atMax) return;
    const k = newKey();
    setKeys([...items.map((_, i) => keyAt(i)), k]);
    setLastAdded(k);
    onChange([...items, Object.fromEntries(f.fields.map((sf) => [sf.key, emptyFor(sf)]))]);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const nextItems = [...items];
    [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
    const nextKeys = items.map((_, k) => keyAt(k));
    [nextKeys[i], nextKeys[j]] = [nextKeys[j], nextKeys[i]];
    setKeys(nextKeys);
    onChange(nextItems);
  }
  function remove(i: number) {
    setKeys(items.map((_, k) => keyAt(k)).filter((_, k) => k !== i));
    onChange(items.filter((_, k) => k !== i));
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3" role="group" aria-labelledby={`${listId}-label`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p id={`${listId}-label`} className="text-sm font-medium text-slate-700">
          {f.label}{" "}
          <span className="text-xs font-normal text-slate-400">
            ({items.length}
            {f.max ? ` / ${f.max}` : ""})
          </span>
        </p>
        <Button type="button" size="sm" variant="outline" disabled={atMax} onClick={add} aria-describedby={atMax ? `${listId}-max` : undefined}>
          <Plus /> Add {f.itemLabel ?? "item"}
        </Button>
      </div>
      {atMax ? (
        <p id={`${listId}-max`} className="mb-2 text-xs text-slate-500">
          Maximum of {f.max} reached. Remove one to add another.
        </p>
      ) : null}
      {f.help ? <Help>{f.help}</Help> : null}
      <FieldError>{err}</FieldError>
      <ol className="space-y-3" aria-label={f.label}>
        {items.map((item, i) => {
          const itemPath = `${path}.${i}`;
          const hasError = Object.keys(errors).some((k) => k === itemPath || k.startsWith(`${itemPath}.`));
          const key = keyAt(i);
          const title = summarise(item, f.fields) || `${f.itemLabel ?? "Item"} ${i + 1}`;
          return (
            <RepeaterItem
              key={key}
              index={i}
              total={items.length}
              title={title}
              itemLabel={f.itemLabel ?? "item"}
              hasError={hasError}
              attempt={attempt}
              defaultOpen={key === lastAdded}
              onMove={(dir) => move(i, dir)}
              onRemove={() => remove(i)}
            >
              <FieldsForm fields={f.fields} value={item} path={itemPath} errors={errors} attempt={attempt} onChange={(v) => onChange(items.map((it, k) => (k === i ? v : it)))} urduEnabled={urduEnabled} compact />
            </RepeaterItem>
          );
        })}
      </ol>
      {items.length === 0 ? <p className="py-3 text-center text-xs text-slate-400">No {f.itemLabel ? `${f.itemLabel}s` : "items"} yet. Use “Add” to create one.</p> : null}
    </div>
  );
}

function summarise(item: Value, fields: FieldDef[]): string {
  for (const f of fields) {
    const v = item[f.key];
    if (f.type === "text" && typeof v === "string" && v) return v;
    if ((f.type === "localized" || f.type === "richtext") && v && typeof v === "object" && (v as { en?: string }).en) return (v as { en: string }).en;
  }
  return "";
}

function RepeaterItem({
  index,
  total,
  title,
  itemLabel,
  hasError,
  attempt,
  defaultOpen,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  title: string;
  itemLabel: string;
  hasError: boolean;
  attempt: number;
  defaultOpen: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  // manual toggle wins until the next save attempt; after an attempt, items with errors open automatically
  const [manual, setManual] = React.useState<{ attempt: number; open: boolean } | null>(defaultOpen ? { attempt, open: true } : null);
  const open = manual?.attempt === attempt ? manual.open : hasError;
  const panelId = React.useId();
  const position = `${index + 1} of ${total}`;
  return (
    <li className={cn("rounded-lg border bg-slate-50/60", hasError ? "border-red-300" : "border-slate-200")}>
      <div className="flex items-center gap-1 px-2 py-1.5 sm:px-3">
        <button
          type="button"
          onClick={() => setManual({ attempt, open: !open })}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded text-left text-sm font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {open ? <ChevronUp className="size-4 shrink-0" aria-hidden="true" /> : <ChevronDown className="size-4 shrink-0" aria-hidden="true" />}
          <span className="truncate">{title}</span>
          <span className="sr-only">, {itemLabel} {position}</span>
          {hasError ? (
            <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              <AlertCircle className="size-3" aria-hidden="true" /> Needs attention
            </span>
          ) : null}
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="flex size-9 items-center justify-center rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`Move “${title}” up`}
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="flex size-9 items-center justify-center rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`Move “${title}” down`}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-9 items-center justify-center rounded text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={`Remove “${title}”`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div id={panelId} hidden={!open} className="space-y-4 border-t border-slate-200 bg-white p-3">
        {open ? children : null}
      </div>
    </li>
  );
}
