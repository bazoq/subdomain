"use client";

/** Create / edit a menu item: localized text, slug, category, price, sizes repeater, image, tags, modifier groups, flags. */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select, Switch } from "@/components/ui/input";
import { ImageField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { cn, slugify } from "@/lib/utils";
import { upsertMenuItem, type MenuItemInput } from "@/modules/restaurant/actions";
import { MENU_TAGS } from "@/modules/restaurant/types";

const SIZE_PRESETS = ["Small", "Medium", "Large", "Family"];

export const emptyMenuItem: MenuItemInput = {
  name: { en: "" },
  description: { en: "" },
  slug: "",
  categoryId: null,
  price: 0,
  sizes: [],
  imageUrl: "",
  tags: [],
  modifierGroupIds: [],
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
};

export function MenuItemForm({
  id,
  initial,
  categories,
  groups,
  urduEnabled,
}: {
  id?: string;
  initial?: MenuItemInput;
  categories: { id: string; name: string }[];
  groups: { id: string; name: string; summary: string }[];
  urduEnabled: boolean;
}) {
  const [v, setV] = React.useState<MenuItemInput>(initial ?? emptyMenuItem);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = React.useState(!!initial?.slug);
  const toast = useToast();
  const router = useRouter();

  const set = <K extends keyof MenuItemInput>(k: K, val: MenuItemInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    setSaving(true);
    setErrors({});
    const res = await upsertMenuItem(id ?? null, v);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      if (!id && res.data) router.push(`/admin/menu/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  const sizes = v.sizes ?? [];
  const setSize = (i: number, patch: Partial<{ name: string; price: number }>) => set("sizes", sizes.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Details</h2>
          <div className="space-y-4">
            <Field label="Item name" error={errors["name.en"]} required>
              <Input
                value={v.name.en}
                onChange={(e) => {
                  set("name", { ...v.name, en: e.target.value });
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
                placeholder="e.g. Chicken Tikka Pizza"
              />
            </Field>
            {urduEnabled ? (
              <div dir="rtl">
                <Field label="نام (اردو)">
                  <Input className="font-urdu" value={v.name.ur ?? ""} onChange={(e) => set("name", { ...v.name, ur: e.target.value })} />
                </Field>
              </div>
            ) : null}
            <Field label="Description" error={errors["description.en"]}>
              <Textarea value={v.description?.en ?? ""} onChange={(e) => set("description", { ...(v.description ?? { en: "" }), en: e.target.value })} placeholder="Toppings, ingredients, what makes it special…" />
            </Field>
            {urduEnabled ? (
              <div dir="rtl">
                <Field label="تفصیل (اردو)">
                  <Textarea className="font-urdu" value={v.description?.ur ?? ""} onChange={(e) => set("description", { ...(v.description ?? { en: "" }), ur: e.target.value })} />
                </Field>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL slug" error={errors.slug} help="Used in links, e.g. /menu#item-chicken-tikka">
                <Input
                  value={v.slug ?? ""}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Category" error={errors.categoryId}>
                <Select value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
                  <option value="">— Uncategorised —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Pricing & sizes</h2>
            <div className="flex gap-1">
              {sizes.length === 0 ? (
                <Button size="sm" variant="outline" onClick={() => set("sizes", SIZE_PRESETS.map((name, i) => ({ name, price: v.price + i * 300 })))}>
                  Use Small / Medium / Large / Family
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => set("sizes", [...sizes, { name: "", price: 0 }])}>
                <Plus /> Add size
              </Button>
            </div>
          </div>
          {sizes.length === 0 ? (
            <Field label="Price (Rs)" error={errors.price} required help="Single price. Add sizes above for size-based pricing.">
              <Input type="number" min={0} value={v.price} onChange={(e) => set("price", Number(e.target.value))} className="max-w-xs" />
            </Field>
          ) : (
            <div className="space-y-2">
              {errors.sizes ? <p className="text-xs font-medium text-red-600">{errors.sizes}</p> : null}
              {sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={s.name} placeholder="Size name (e.g. Medium)" onChange={(e) => setSize(i, { name: e.target.value })} list="size-presets" />
                  <Input type="number" min={0} value={s.price} placeholder="Price" className="w-36" onChange={(e) => setSize(i, { price: Number(e.target.value) })} />
                  <Button size="icon" variant="ghost" className="text-red-600" onClick={() => set("sizes", sizes.filter((_, k) => k !== i))} aria-label="Remove size">
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <datalist id="size-presets">
                {SIZE_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500">The lowest size price is shown as the “from” price on the menu.</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Add-ons & modifiers</h2>
          <p className="mb-3 text-xs text-slate-500">Customers can pick from these groups when adding the item (extra toppings, crust, drinks…).</p>
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">
              No modifier groups yet.{" "}
              <a href="/admin/menu/modifiers" className="text-brand-600 underline">
                Create one
              </a>
              .
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((g) => {
                const on = v.modifierGroupIds.includes(g.id);
                return (
                  <label key={g.id} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm", on ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:bg-slate-50")}>
                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" checked={on} onChange={(e) => set("modifierGroupIds", e.target.checked ? [...v.modifierGroupIds, g.id] : v.modifierGroupIds.filter((x) => x !== g.id))} />
                    <span>
                      <span className="font-medium text-slate-900">{g.name}</span>
                      <span className="block text-xs text-slate-500">{g.summary}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Photo</h2>
          <ImageField value={v.imageUrl ?? ""} onChange={(url) => set("imageUrl", url)} folder="menu" aspect="aspect-[4/3]" />
        </section>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Visibility</h2>
          <Switch checked={v.isAvailable} onChange={(b) => set("isAvailable", b)} label="Available for ordering" />
          <Switch checked={v.isFeatured} onChange={(b) => set("isFeatured", b)} label="Featured (deals / home page)" />
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {MENU_TAGS.map((tag) => {
                const on = v.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => set("tags", on ? v.tags.filter((x) => x !== tag) : [...v.tags, tag])}
                    className={cn("rounded-full border px-3 py-1 text-xs font-medium capitalize", on ? "border-brand-500 bg-brand-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Sort order" help="Lower numbers appear first">
            <Input type="number" min={0} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
          </Field>
        </section>
        <div className="flex gap-2">
          <Button onClick={save} loading={saving} className="flex-1">
            {id ? "Save changes" : "Add item"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/menu")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
