"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/templates/fields";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, Help, Switch } from "@/components/ui/input";
import { ImageField, ImagesField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { saveSection, resetSection } from "@/server/content/actions";
import { cn } from "@/lib/utils";

type Value = Record<string, unknown>;

function emptyFor(f: Field): unknown {
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
  fields: Field[];
  initial: Value;
  urduEnabled: boolean;
}) {
  const [value, setValue] = React.useState<Value>(initial);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  function update(next: Value) {
    setValue(next);
    setDirty(true);
  }

  async function onSave() {
    setSaving(true);
    const res = await saveSection(sectionKey, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setDirty(false);
      router.refresh();
    } else toast.push("error", res.message);
  }

  async function onReset() {
    if (!window.confirm("Reset this section to the template's default content? Your changes will be lost.")) return;
    const res = await resetSection(sectionKey);
    if (res.ok) {
      toast.push("success", res.message ?? "Reset");
      router.refresh();
    } else toast.push("error", res.message);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        <div className="mt-5 space-y-5">
          <FieldsForm fields={fields} value={value} onChange={update} urduEnabled={urduEnabled} />
        </div>
      </div>
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" onClick={onReset}>
          Reset to default
        </Button>
        <div className="flex items-center gap-3">
          {dirty ? <span className="text-xs text-amber-600">Unsaved changes</span> : null}
          <Button type="button" onClick={onSave} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FieldsForm({
  fields,
  value,
  onChange,
  urduEnabled,
  compact,
}: {
  fields: Field[];
  value: Value;
  onChange: (v: Value) => void;
  urduEnabled: boolean;
  compact?: boolean;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <>
      {fields.map((f) => (
        <FieldControl key={f.key} field={f} value={value[f.key] ?? emptyFor(f)} onChange={(v) => set(f.key, v)} urduEnabled={urduEnabled} compact={compact} />
      ))}
    </>
  );
}

function FieldControl({
  field: f,
  value,
  onChange,
  urduEnabled,
  compact,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  urduEnabled: boolean;
  compact?: boolean;
}) {
  const id = React.useId();
  switch (f.type) {
    case "text":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <Input id={id} value={(value as string) ?? ""} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "localized":
    case "richtext": {
      const v = (value as { en: string; ur?: string }) ?? { en: "" };
      const multi = f.type === "richtext" || (f.type === "localized" && f.multiline);
      const Cmp = multi ? Textarea : Input;
      return (
        <div className={cn("grid gap-3", urduEnabled && "md:grid-cols-2")}>
          <div>
            <Label htmlFor={id}>{f.label}</Label>
            <Cmp id={id} value={v.en ?? ""} onChange={(e) => onChange({ ...v, en: e.target.value })} className={multi && f.type === "richtext" ? "min-h-[140px]" : undefined} />
            {f.help ? <Help>{f.help}</Help> : null}
            {f.type === "richtext" ? <Help>Plain text or simple markdown (blank line = new paragraph, &quot;- &quot; = bullet).</Help> : null}
          </div>
          {urduEnabled ? (
            <div dir="rtl">
              <Label htmlFor={id + "ur"} className="text-right">
                {f.label} (اردو)
              </Label>
              <Cmp id={id + "ur"} value={v.ur ?? ""} onChange={(e) => onChange({ ...v, ur: e.target.value })} className="font-urdu" />
            </div>
          ) : null}
        </div>
      );
    }
    case "number":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <Input id={id} type="number" min={f.min} max={f.max} value={(value as number) ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "boolean":
      return (
        <div>
          <Switch checked={Boolean(value)} onChange={onChange} label={f.label} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "select":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <Select id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "color":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={(value as string) || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-slate-300" />
            <Input id={id} value={(value as string) ?? ""} placeholder="#RRGGBB (blank = template default)" onChange={(e) => onChange(e.target.value)} />
          </div>
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "image":
      return (
        <div>
          <Label>{f.label}</Label>
          <ImageField value={(value as string) ?? ""} onChange={onChange} folder="sections" className={compact ? "max-w-xs" : "max-w-md"} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "images":
      return (
        <div>
          <Label>{f.label}</Label>
          <ImagesField value={(value as string[]) ?? []} onChange={onChange} folder="sections" max={f.max ?? 12} />
          {f.help ? <Help>{f.help}</Help> : null}
        </div>
      );
    case "link": {
      const v = (value as { label: { en: string; ur?: string }; href: string }) ?? { label: { en: "" }, href: "" };
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">{f.label}</p>
          <div className={cn("grid gap-3", urduEnabled ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <div>
              <Label>Button text</Label>
              <Input value={v.label?.en ?? ""} onChange={(e) => onChange({ ...v, label: { ...v.label, en: e.target.value } })} />
            </div>
            {urduEnabled ? (
              <div dir="rtl">
                <Label className="text-right">Button text (اردو)</Label>
                <Input className="font-urdu" value={v.label?.ur ?? ""} onChange={(e) => onChange({ ...v, label: { ...v.label, ur: e.target.value } })} />
              </div>
            ) : null}
            <div>
              <Label>Link</Label>
              <Input value={v.href ?? ""} placeholder="/shop, #about, https://…, whatsapp, tel" onChange={(e) => onChange({ ...v, href: e.target.value })} />
            </div>
          </div>
          {f.help ? <Help>{f.help}</Help> : <Help>Use &quot;whatsapp&quot; or &quot;tel&quot; to link to your WhatsApp / phone from Settings.</Help>}
        </div>
      );
    }
    case "icon":
      return (
        <div>
          <Label htmlFor={id}>{f.label}</Label>
          <Input id={id} value={(value as string) ?? ""} placeholder="Lucide icon name, e.g. Truck" onChange={(e) => onChange(e.target.value)} />
          <Help>
            Any icon name from{" "}
            <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">
              lucide.dev/icons
            </a>
            .
          </Help>
        </div>
      );
    case "repeater": {
      const items = (value as Value[]) ?? [];
      const setItems = (next: Value[]) => onChange(next);
      return (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {f.label} <span className="text-xs font-normal text-slate-400">({items.length}{f.max ? ` / ${f.max}` : ""})</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={f.max != null && items.length >= f.max}
              onClick={() => setItems([...items, Object.fromEntries(f.fields.map((sf) => [sf.key, emptyFor(sf)]))])}
            >
              <Plus /> Add {f.itemLabel ?? "item"}
            </Button>
          </div>
          {f.help ? <Help>{f.help}</Help> : null}
          <div className="space-y-3">
            {items.map((item, i) => (
              <RepeaterItem
                key={i}
                index={i}
                total={items.length}
                onMove={(dir) => {
                  const j = i + dir;
                  if (j < 0 || j >= items.length) return;
                  const next = [...items];
                  [next[i], next[j]] = [next[j], next[i]];
                  setItems(next);
                }}
                onRemove={() => setItems(items.filter((_, k) => k !== i))}
                title={summarise(item, f.fields) || `${f.itemLabel ?? "Item"} ${i + 1}`}
              >
                <FieldsForm fields={f.fields} value={item} onChange={(v) => setItems(items.map((it, k) => (k === i ? v : it)))} urduEnabled={urduEnabled} compact />
              </RepeaterItem>
            ))}
            {items.length === 0 ? <p className="py-3 text-center text-xs text-slate-400">No items yet.</p> : null}
          </div>
        </div>
      );
    }
  }
}

function summarise(item: Value, fields: Field[]): string {
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
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  title: string;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-slate-800">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          <span className="truncate">{title}</span>
        </button>
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30" title="Move up">
          <ChevronUp className="size-4" />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30" title="Move down">
          <ChevronDown className="size-4" />
        </button>
        <button type="button" onClick={onRemove} className="rounded p-1 text-red-500 hover:bg-red-50" title="Remove">
          <Trash2 className="size-4" />
        </button>
      </div>
      {open ? <div className="space-y-4 border-t border-slate-200 bg-white p-3">{children}</div> : null}
    </div>
  );
}
