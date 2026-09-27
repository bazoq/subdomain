"use client";

/** Menu categories: list with up/down reorder, add/edit dialog, delete. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import { deleteMenuCategory, reorderMenuCategories, upsertMenuCategory, type MenuCategoryInput } from "@/modules/restaurant/actions";

export interface CategoryRow {
  id: string;
  name: { en: string; ur?: string };
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  itemCount: number;
}

const empty: MenuCategoryInput = { name: { en: "" }, slug: "", imageUrl: "", isActive: true };

export function CategoryManager({ rows, urduEnabled }: { rows: CategoryRow[]; urduEnabled: boolean }) {
  const [list, setList] = React.useState(rows);
  const [prevRows, setPrevRows] = React.useState(rows);
  const [editing, setEditing] = React.useState<{ id: string | null; value: MenuCategoryInput } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  // adopt fresh server rows after router.refresh() (derived state from props)
  if (rows !== prevRows) {
    setPrevRows(rows);
    setList(rows);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const res = await upsertMenuCategory(editing.id, editing.value);
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

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    const res = await reorderMenuCategories(next.map((c) => c.id));
    if (!res.ok) toast.push("error", res.message);
    else router.refresh();
  }

  async function remove(c: CategoryRow) {
    if (!window.confirm(`Delete "${c.name.en}"? Its ${c.itemCount} item(s) will become uncategorised.`)) return;
    const res = await deleteMenuCategory(c.id);
    if (res.ok) {
      toast.push("success", res.message ?? "Deleted");
      router.refresh();
    } else toast.push("error", res.message);
  }

  const v = editing?.value ?? empty;
  const setV = (patch: Partial<MenuCategoryInput>) => setEditing((e) => (e ? { ...e, value: { ...e.value, ...patch } } : e));

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({ id: null, value: empty })}>
          <Plus /> Add category
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">No categories yet. Add “Pizzas”, “Deals”, “Sides”, “Drinks”…</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {list.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="size-4" />
                </button>
              </div>
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="size-12 rounded-lg object-cover" />
              ) : (
                <div className="size-12 rounded-lg bg-slate-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {c.name.en}
                  {c.name.ur ? <span className="font-urdu ms-2 text-sm text-slate-500">{c.name.ur}</span> : null}
                </p>
                <p className="text-xs text-slate-500">
                  /{c.slug} · {c.itemCount} item{c.itemCount === 1 ? "" : "s"}
                </p>
              </div>
              <Badge tone={c.isActive ? "success" : "default"}>{c.isActive ? "Visible" : "Hidden"}</Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing({ id: c.id, value: { name: c.name, slug: c.slug, imageUrl: c.imageUrl ?? "", isActive: c.isActive } })}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(c)} aria-label="Delete">
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit category" : "Add category"}
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
          <Field label="Name" error={errors["name.en"]} required>
            <Input
              value={v.name.en}
              onChange={(e) => setV({ name: { ...v.name, en: e.target.value }, ...(editing?.id ? {} : { slug: slugify(e.target.value) }) })}
              placeholder="e.g. Pizzas"
            />
          </Field>
          {urduEnabled ? (
            <div dir="rtl">
              <Field label="نام (اردو)">
                <Input className="font-urdu" value={v.name.ur ?? ""} onChange={(e) => setV({ name: { ...v.name, ur: e.target.value } })} />
              </Field>
            </div>
          ) : null}
          <Field label="Slug" error={errors.slug}>
            <Input value={v.slug ?? ""} onChange={(e) => setV({ slug: slugify(e.target.value) })} />
          </Field>
          <Switch checked={v.isActive} onChange={(b) => setV({ isActive: b })} label="Show on menu" />
          <Field label="Image (optional)">
            <ImageField label="Category image" value={v.imageUrl ?? ""} onChange={(url) => setV({ imageUrl: url })} folder="menu" aspect="aspect-video" className="max-w-[240px]" />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
