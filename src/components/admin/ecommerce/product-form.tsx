"use client";

/**
 * Product create / edit form (client state + JSON server action `upsertProduct`).
 * Sections: basics · pricing & stock · images · variants · attributes & specs · medical (medical stores) · SEO.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea, Select, Switch, Help } from "@/components/ui/input";
import { ImageField, ImagesField } from "@/components/admin/uploader";
import { ActionButton } from "@/components/admin/action-button";
import { useToast } from "@/components/ui/toast";
import { deleteProduct, upsertProduct } from "@/modules/ecommerce/actions";
import type { KeyValue, VariantOptions } from "@/modules/ecommerce/types";
import type { LocalizedString } from "@/lib/i18n";
import { cn, formatPKR, slugify } from "@/lib/utils";

export interface VariantRow {
  id?: string;
  name: string;
  options: VariantOptions;
  price: number | null;
  sku: string;
  stock: number;
  imageUrl: string;
  isActive: boolean;
}

export interface ProductFormValue {
  name: LocalizedString;
  slug: string;
  categoryId: string;
  shortDesc: LocalizedString;
  description: LocalizedString;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
  sku: string;
  stock: number;
  trackStock: boolean;
  images: string[];
  tags: string[];
  attributes: KeyValue[];
  specs: KeyValue[];
  variants: VariantRow[];
  requiresPrescription: boolean;
  genericName: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
}

export interface CategoryOption {
  id: string;
  label: string;
}

export const emptyProduct: ProductFormValue = {
  name: { en: "" },
  slug: "",
  categoryId: "",
  shortDesc: { en: "" },
  description: { en: "" },
  price: 0,
  comparePrice: null,
  costPrice: null,
  sku: "",
  stock: 0,
  trackStock: true,
  images: [],
  tags: [],
  attributes: [],
  specs: [],
  variants: [],
  requiresPrescription: false,
  genericName: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  isFeatured: false,
  isActive: true,
  seoTitle: "",
  seoDescription: "",
};

type OptionDef = { name: string; values: string };

function defsFromVariants(variants: VariantRow[]): OptionDef[] {
  const names: string[] = [];
  for (const v of variants) for (const k of Object.keys(v.options)) if (!names.includes(k)) names.push(k);
  return names.map((name) => {
    const vals: string[] = [];
    for (const v of variants) {
      const val = v.options[name];
      if (val && !vals.includes(val)) vals.push(val);
    }
    return { name, values: vals.join(", ") };
  });
}

function sameOptions(a: VariantOptions, b: VariantOptions): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => a[k] === b[k]);
}

function cartesian(defs: { name: string; values: string[] }[]): VariantOptions[] {
  return defs.reduce<VariantOptions[]>((acc, d) => acc.flatMap((combo) => d.values.map((v) => ({ ...combo, [d.name]: v }))), [{}]);
}

const numOrNull = (s: string): number | null => (s.trim() === "" ? null : Math.max(0, Math.floor(Number(s)) || 0));
const num = (s: string): number => Math.max(0, Math.floor(Number(s)) || 0);

export function ProductForm({
  id,
  initial,
  categories,
  urduEnabled,
  isMedical,
  lowStockThreshold = 5,
}: {
  id?: string;
  initial?: ProductFormValue;
  categories: CategoryOption[];
  urduEnabled: boolean;
  isMedical: boolean;
  lowStockThreshold?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = React.useState<ProductFormValue>(initial ?? emptyProduct);
  const [slugTouched, setSlugTouched] = React.useState(!!id);
  const [tagsText, setTagsText] = React.useState((initial?.tags ?? []).join(", "));
  const [defs, setDefs] = React.useState<OptionDef[]>(() => defsFromVariants(initial?.variants ?? []));
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const set = <K extends keyof ProductFormValue>(k: K, v: ProductFormValue[K]) => setValue((p) => ({ ...p, [k]: v }));
  const setLoc = (k: "name" | "shortDesc" | "description", lang: "en" | "ur", v: string) => setValue((p) => ({ ...p, [k]: { ...p[k], [lang]: v } }));

  function onNameEn(v: string) {
    setValue((p) => ({ ...p, name: { ...p.name, en: v }, slug: slugTouched ? p.slug : slugify(v) }));
  }

  function generateVariants() {
    const clean = defs
      .map((d) => ({ name: d.name.trim(), values: Array.from(new Set(d.values.split(",").map((s) => s.trim()).filter(Boolean))) }))
      .filter((d) => d.name && d.values.length);
    if (!clean.length) {
      set("variants", []);
      return;
    }
    const combos = cartesian(clean);
    if (combos.length > 100) {
      toast.push("error", `Too many combinations (${combos.length}). Maximum is 100 variants.`);
      return;
    }
    const next: VariantRow[] = combos.map((options) => {
      const existing = value.variants.find((v) => sameOptions(v.options, options));
      return existing ? { ...existing, options } : { name: clean.map((d) => options[d.name]).join(" / "), options, price: null, sku: "", stock: 0, imageUrl: "", isActive: true };
    });
    const dropped = value.variants.filter((v) => !next.some((n) => sameOptions(n.options, v.options))).length;
    if (dropped && !window.confirm(`${dropped} existing variant(s) do not match the new options and will be removed. Continue?`)) return;
    set("variants", next);
  }

  const updateVariant = (i: number, patch: Partial<VariantRow>) => set("variants", value.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  async function save() {
    setSaving(true);
    setErrors({});
    const tags = Array.from(new Set(tagsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
    const res = await upsertProduct(id ?? null, { ...value, tags, categoryId: value.categoryId || null });
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      if (!id && res.data?.id) router.push(`/admin/products/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const hasVariants = value.variants.length > 0;
  const variantStock = value.variants.reduce((n, v) => n + (v.isActive ? v.stock : 0), 0);
  const margin = value.costPrice != null && value.price > 0 ? value.price - value.costPrice : null;

  const kvEditor = (key: "attributes" | "specs", label: string, help: string, keyPlaceholder: string, valuePlaceholder: string) => {
    const rows = value[key];
    const setRows = (rows: KeyValue[]) => set(key, rows);
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setRows([...rows, { key: "", value: "" }])}>
            <Plus /> Add
          </Button>
        </div>
        <Help>{help}</Help>
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`${label} name`} placeholder={keyPlaceholder} value={r.key} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} className="w-2/5" />
              <Input aria-label={`${label} value`} placeholder={valuePlaceholder} value={r.value} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} className="shrink-0 rounded p-2 text-red-500 hover:bg-red-50" aria-label="Remove row">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {rows.length === 0 ? <p className="py-2 text-center text-xs text-slate-400">None yet.</p> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* basics */}
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn("grid gap-4", urduEnabled && "md:grid-cols-2")}>
              <Field label="Product name" error={errors["name.en"] ?? errors.name} required>
                <Input value={value.name.en} onChange={(e) => onNameEn(e.target.value)} placeholder="e.g. Non-stick Frying Pan 28cm" />
              </Field>
              {urduEnabled ? (
                <div dir="rtl">
                  <Field label="Product name (اردو)">
                    <Input className="font-urdu" value={value.name.ur ?? ""} onChange={(e) => setLoc("name", "ur", e.target.value)} />
                  </Field>
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="URL slug" error={errors.slug} help={`/shop/${value.slug || "…"}`} required>
                <Input
                  value={value.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value).replace(/-+$/, "") || e.target.value.toLowerCase());
                  }}
                  onBlur={(e) => set("slug", slugify(e.target.value))}
                />
              </Field>
              <Field label="Category" error={errors.categoryId}>
                <Select value={value.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className={cn("grid gap-4", urduEnabled && "md:grid-cols-2")}>
              <Field label="Short description" help="One or two lines shown on product cards and under the title.">
                <Textarea className="min-h-[70px]" value={value.shortDesc.en} onChange={(e) => setLoc("shortDesc", "en", e.target.value)} />
              </Field>
              {urduEnabled ? (
                <div dir="rtl">
                  <Field label="Short description (اردو)">
                    <Textarea className="font-urdu min-h-[70px]" value={value.shortDesc.ur ?? ""} onChange={(e) => setLoc("shortDesc", "ur", e.target.value)} />
                  </Field>
                </div>
              ) : null}
            </div>
            <div className={cn("grid gap-4", urduEnabled && "md:grid-cols-2")}>
              <Field label="Full description" help='Plain text or simple markdown (blank line = paragraph, "- " = bullet, **bold**).'>
                <Textarea className="min-h-[160px]" value={value.description.en} onChange={(e) => setLoc("description", "en", e.target.value)} />
              </Field>
              {urduEnabled ? (
                <div dir="rtl">
                  <Field label="Full description (اردو)">
                    <Textarea className="font-urdu min-h-[160px]" value={value.description.ur ?? ""} onChange={(e) => setLoc("description", "ur", e.target.value)} />
                  </Field>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* pricing & stock */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & stock</CardTitle>
            <CardDescription>All amounts in PKR (whole rupees).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Selling price" error={errors.price} required>
                <Input type="number" min={0} inputMode="numeric" value={value.price} onChange={(e) => set("price", num(e.target.value))} />
              </Field>
              <Field label="Compare-at price" error={errors.comparePrice} help="Shown struck-through; must be higher than the price.">
                <Input type="number" min={0} inputMode="numeric" value={value.comparePrice ?? ""} onChange={(e) => set("comparePrice", numOrNull(e.target.value))} />
              </Field>
              <Field label="Cost price" error={errors.costPrice} help={margin != null ? `Margin ${formatPKR(margin)}` : "Private; used for margins."}>
                <Input type="number" min={0} inputMode="numeric" value={value.costPrice ?? ""} onChange={(e) => set("costPrice", numOrNull(e.target.value))} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="SKU" error={errors.sku}>
                <Input value={value.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. PAN-28-BLK" />
              </Field>
              <Field label="Stock quantity" error={errors.stock} help={hasVariants ? `Managed per variant (total ${variantStock}).` : value.trackStock ? `Low-stock alert at ${lowStockThreshold}.` : "Ignored when stock is not tracked."}>
                <Input type="number" min={0} inputMode="numeric" value={value.stock} disabled={hasVariants} onChange={(e) => set("stock", num(e.target.value))} />
              </Field>
              <div className="pt-7">
                <Switch checked={value.trackStock} onChange={(v) => set("trackStock", v)} label="Track stock" />
                <Help>Untracked products never show out of stock.</Help>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>First image is the main one. Square images (1000×1000) look best.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImagesField label="Product images" value={value.images} onChange={(urls) => set("images", urls)} folder="products" max={12} />
            {errors.images ? <p className="mt-1 text-xs text-red-600">{errors.images}</p> : null}
          </CardContent>
        </Card>

        {/* variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Define options such as Size or Colour, then generate the combinations. Leave empty for a simple product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {defs.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label="Option name" placeholder="Option, e.g. Size" value={d.name} onChange={(e) => setDefs(defs.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className="w-1/3" />
                  <Input aria-label="Option values" placeholder="Values, comma separated: S, M, L, XL" value={d.values} onChange={(e) => setDefs(defs.map((x, k) => (k === i ? { ...x, values: e.target.value } : x)))} />
                  <button type="button" onClick={() => setDefs(defs.filter((_, k) => k !== i))} className="shrink-0 rounded p-2 text-red-500 hover:bg-red-50" aria-label="Remove option">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={defs.length >= 3} onClick={() => setDefs([...defs, { name: "", values: "" }])}>
                  <Plus /> Add option
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={generateVariants} disabled={!defs.length && !value.variants.length}>
                  <Wand2 /> Generate variants
                </Button>
              </div>
            </div>
            {errors.variants ? <p className="text-xs text-red-600">{errors.variants}</p> : null}
            {value.variants.length ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Variant</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {value.variants.map((v, i) => (
                      <tr key={v.id ?? i} className="align-top">
                        <td className="px-3 py-2">
                          <Input aria-label="Variant name" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} className="min-w-32" />
                          <p className="mt-1 text-xs text-slate-400">
                            {Object.entries(v.options)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(" · ")}
                          </p>
                          {errors[`variants.${i}.name`] ? <p className="text-xs text-red-600">{errors[`variants.${i}.name`]}</p> : null}
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label="Variant price" type="number" min={0} placeholder={String(value.price)} value={v.price ?? ""} onChange={(e) => updateVariant(i, { price: numOrNull(e.target.value) })} className="w-28" />
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label="Variant stock" type="number" min={0} value={v.stock} onChange={(e) => updateVariant(i, { stock: num(e.target.value) })} className={cn("w-20", value.trackStock && v.stock <= lowStockThreshold && "border-amber-400 bg-amber-50")} />
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label="Variant SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} className="w-28" />
                        </td>
                        <td className="px-3 py-2">
                          <ImageField label={`Variant ${i + 1} image`} value={v.imageUrl} onChange={(url) => updateVariant(i, { imageUrl: url })} folder="products" aspect="aspect-square" className="w-16" />
                        </td>
                        <td className="px-3 py-3">
                          <Switch checked={v.isActive} onChange={(val) => updateVariant(i, { isActive: val })} />
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => set("variants", value.variants.filter((_, k) => k !== i))} className="rounded p-2 text-red-500 hover:bg-red-50" aria-label="Remove variant">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* attributes & specs */}
        <Card>
          <CardHeader>
            <CardTitle>Attributes & specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {kvEditor("attributes", "Attributes", "Short facts shown under the price, e.g. Brand, Material, Warranty.", "Brand", "Prestige")}
            {kvEditor("specs", "Specifications", "Detailed spec table shown on the product page.", "Screen size", "6.7 inch AMOLED")}
          </CardContent>
        </Card>

        {/* medical */}
        {isMedical ? (
          <Card>
            <CardHeader>
              <CardTitle>Medicine information</CardTitle>
              <CardDescription>Shown on the product page. Prescription-only medicines require the customer to upload a prescription at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Switch checked={value.requiresPrescription} onChange={(v) => set("requiresPrescription", v)} label="Requires prescription (Rx)" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Generic name" error={errors.genericName}>
                  <Input value={value.genericName} onChange={(e) => set("genericName", e.target.value)} placeholder="e.g. Paracetamol" />
                </Field>
                <Field label="Manufacturer" error={errors.manufacturer}>
                  <Input value={value.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="e.g. GSK Pakistan" />
                </Field>
                <Field label="Dosage form" error={errors.dosageForm}>
                  <Input value={value.dosageForm} onChange={(e) => set("dosageForm", e.target.value)} placeholder="Tablet, Syrup, Capsule…" />
                </Field>
                <Field label="Strength" error={errors.strength}>
                  <Input value={value.strength} onChange={(e) => set("strength", e.target.value)} placeholder="e.g. 500 mg" />
                </Field>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* seo */}
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
            <CardDescription>Optional. Defaults to the product name and short description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Meta title" error={errors.seoTitle}>
              <Input maxLength={120} value={value.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </Field>
            <Field label="Meta description" error={errors.seoDescription}>
              <Textarea maxLength={300} className="min-h-[70px]" value={value.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch checked={value.isActive} onChange={(v) => set("isActive", v)} label="Active (visible in shop)" />
            <Switch checked={value.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured on home page" />
            {!isMedical ? (
              <Field label="Manufacturer / brand" error={errors.manufacturer}>
                <Input value={value.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
              </Field>
            ) : null}
            <Field label="Tags" help="Comma separated, e.g. new, bestseller, eid-sale" error={errors.tags}>
              <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <div className="sticky top-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button type="button" className="w-full" onClick={save} loading={saving}>
            <Sparkles /> {id ? "Save changes" : "Create product"}
          </Button>
          {id ? (
            <>
              <Link href={`/shop/${value.slug}`} target="_blank" className="block text-center text-sm text-brand-600 hover:underline">
                View on website ↗
              </Link>
              <ActionButton variant="ghost" className="w-full text-red-600" confirm="Delete this product? If it appears in any past order it will be hidden from the shop (archived) instead, so order history is kept." action={() => deleteProduct(id)} redirectTo="/admin/products">
                <Trash2 /> Delete product
              </ActionButton>
            </>
          ) : (
            <Link href="/admin/products" className="block text-center text-sm text-slate-500 hover:underline">
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
