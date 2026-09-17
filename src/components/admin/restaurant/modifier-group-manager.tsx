"use client";

/** Modifier groups (e.g. "Extra toppings", "Crust") with min/max/required and option rows. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch, Checkbox } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatPKR } from "@/lib/utils";
import { deleteModifierGroup, upsertModifierGroup, type ModifierGroupInput } from "@/modules/restaurant/actions";

export interface ModifierGroupRow {
  id: string;
  name: { en: string; ur?: string };
  minSelect: number;
  maxSelect: number;
  required: boolean;
  sortOrder: number;
  itemCount: number;
  modifiers: { id: string; name: { en: string; ur?: string }; price: number; isActive: boolean }[];
}

const empty: ModifierGroupInput = { name: { en: "" }, minSelect: 0, maxSelect: 1, required: false, sortOrder: 0, modifiers: [{ id: "", name: { en: "" }, price: 0, isActive: true }] };

export function ModifierGroupManager({ rows, urduEnabled }: { rows: ModifierGroupRow[]; urduEnabled: boolean }) {
  const [editing, setEditing] = React.useState<{ id: string | null; value: ModifierGroupInput } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const res = await upsertModifierGroup(editing.id, editing.value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setEditing(null);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  async function remove(g: ModifierGroupRow) {
    if (!window.confirm(`Delete "${g.name.en}"? It will be removed from ${g.itemCount} item(s).`)) return;
    const res = await deleteModifierGroup(g.id);
    if (res.ok) {
      toast.push("success", res.message ?? "Deleted");
      router.refresh();
    } else toast.push("error", res.message);
  }

  const v = editing?.value ?? empty;
  const setV = (patch: Partial<ModifierGroupInput>) => setEditing((e) => (e ? { ...e, value: { ...e.value, ...patch } } : e));
  const setMod = (i: number, patch: Partial<ModifierGroupInput["modifiers"][number]>) => setV({ modifiers: v.modifiers.map((m, k) => (k === i ? { ...m, ...patch } : m)) });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ id: null, value: { ...empty, sortOrder: rows.length } })}>
          <Plus /> Add group
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">
          No modifier groups yet. Typical groups: “Extra toppings” (0–5), “Crust” (required, pick 1), “Add a drink”.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((g) => (
            <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {g.name.en}
                    {g.name.ur ? <span className="font-urdu ms-2 text-sm font-normal text-slate-500">{g.name.ur}</span> : null}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap gap-1 text-xs text-slate-500">
                    <Badge tone={g.required ? "warning" : "default"}>{g.required ? "Required" : "Optional"}</Badge>
                    <Badge>
                      Pick {g.minSelect}–{g.maxSelect}
                    </Badge>
                    <Badge tone="info">
                      {g.itemCount} item{g.itemCount === 1 ? "" : "s"}
                    </Badge>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing({
                        id: g.id,
                        value: { name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect, required: g.required, sortOrder: g.sortOrder, modifiers: g.modifiers.map((m) => ({ id: m.id, name: m.name, price: m.price, isActive: m.isActive })) },
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(g)} aria-label="Delete">
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {g.modifiers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-1.5">
                    <span className={m.isActive ? "" : "text-slate-400 line-through"}>{m.name.en}</span>
                    <span className="text-slate-600">{m.price ? `+${formatPKR(m.price)}` : "Free"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit modifier group" : "Add modifier group"}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Group name" error={errors["name.en"]} required>
              <Input value={v.name.en} onChange={(e) => setV({ name: { ...v.name, en: e.target.value } })} placeholder="e.g. Extra toppings" />
            </Field>
            {urduEnabled ? (
              <div dir="rtl">
                <Field label="نام (اردو)">
                  <Input className="font-urdu" value={v.name.ur ?? ""} onChange={(e) => setV({ name: { ...v.name, ur: e.target.value } })} />
                </Field>
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min selections" error={errors.minSelect}>
              <Input type="number" min={0} max={20} value={v.minSelect} onChange={(e) => setV({ minSelect: Number(e.target.value) })} />
            </Field>
            <Field label="Max selections" error={errors.maxSelect} help="1 = single choice (radio)">
              <Input type="number" min={1} max={20} value={v.maxSelect} onChange={(e) => setV({ maxSelect: Number(e.target.value) })} />
            </Field>
            <div className="pt-7">
              <Switch checked={v.required} onChange={(b) => setV({ required: b })} label="Required" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Options</span>
              <Button size="sm" variant="outline" onClick={() => setV({ modifiers: [...v.modifiers, { id: "", name: { en: "" }, price: 0, isActive: true }] })}>
                <Plus /> Add option
              </Button>
            </div>
            {errors.modifiers ? <p className="mb-2 text-xs font-medium text-red-600">{errors.modifiers}</p> : null}
            <div className="space-y-2">
              {v.modifiers.map((m, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <Input className="min-w-[140px] flex-1" placeholder="Option name (e.g. Extra cheese)" value={m.name.en} onChange={(e) => setMod(i, { name: { ...m.name, en: e.target.value } })} />
                  {urduEnabled ? <Input className="font-urdu min-w-[120px] flex-1" dir="rtl" placeholder="اردو" value={m.name.ur ?? ""} onChange={(e) => setMod(i, { name: { ...m.name, ur: e.target.value } })} /> : null}
                  <Input type="number" min={0} className="w-28" placeholder="Rs" value={m.price} onChange={(e) => setMod(i, { price: Number(e.target.value) })} />
                  <Checkbox label="Active" checked={m.isActive} onChange={(e) => setMod(i, { isActive: e.target.checked })} />
                  <Button size="icon" variant="ghost" className="text-red-600" disabled={v.modifiers.length === 1} onClick={() => setV({ modifiers: v.modifiers.filter((_, k) => k !== i) })} aria-label="Remove option">
                    <Trash2 />
                  </Button>
                  {errors[`modifiers.${i}.name.en`] ? <p className="w-full text-xs text-red-600">{errors[`modifiers.${i}.name.en`]}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
