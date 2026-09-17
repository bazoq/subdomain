"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/input";
import { ImageField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { upsertCategory } from "@/modules/ecommerce/actions";
import type { LocalizedString } from "@/lib/i18n";
import { slugify } from "@/lib/utils";

export interface CategoryFormValue {
  name: LocalizedString;
  slug: string;
  parentId: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

const empty: CategoryFormValue = { name: { en: "" }, slug: "", parentId: "", imageUrl: "", sortOrder: 0, isActive: true };

export function CategoryFormButton({
  id,
  initial,
  parents,
  urduEnabled,
  variant = "default",
  label,
}: {
  id?: string;
  initial?: CategoryFormValue;
  /** candidate parent categories (top-level only, excluding self) */
  parents: { id: string; label: string }[];
  urduEnabled: boolean;
  variant?: "default" | "outline" | "ghost";
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<CategoryFormValue>(initial ?? empty);
  const [slugTouched, setSlugTouched] = React.useState(!!id);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await upsertCategory(id ?? null, { ...value, parentId: value.parentId || null });
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setOpen(false);
      if (!id) {
        setValue(empty);
        setSlugTouched(false);
      }
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <>
      <Button variant={variant} size={id ? "sm" : "default"} onClick={() => setOpen(true)}>
        {!id ? <Plus /> : null}
        {label ?? (id ? "Edit" : "Add category")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={id ? "Edit category" : "Add category"}
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
          <Field label="Name" error={errors["name.en"] ?? errors.name} required>
            <Input
              value={value.name.en}
              onChange={(e) => setValue({ ...value, name: { ...value.name, en: e.target.value }, slug: slugTouched ? value.slug : slugify(e.target.value) })}
              placeholder="e.g. Cookware"
            />
          </Field>
          {urduEnabled ? (
            <div dir="rtl">
              <Field label="Name (اردو)">
                <Input className="font-urdu" value={value.name.ur ?? ""} onChange={(e) => setValue({ ...value, name: { ...value.name, ur: e.target.value } })} />
              </Field>
            </div>
          ) : null}
          <Field label="Slug" error={errors.slug} help={`/shop/c/${value.slug || "…"}`} required>
            <Input
              value={value.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setValue({ ...value, slug: e.target.value.toLowerCase() });
              }}
              onBlur={(e) => setValue({ ...value, slug: slugify(e.target.value) })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent category" error={errors.parentId}>
              <Select value={value.parentId} onChange={(e) => setValue({ ...value, parentId: e.target.value })}>
                <option value="">None (top level)</option>
                {parents
                  .filter((p) => p.id !== id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Sort order" error={errors.sortOrder} help="Lower numbers appear first.">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => setValue({ ...value, sortOrder: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
          </div>
          <Switch checked={value.isActive} onChange={(v) => setValue({ ...value, isActive: v })} label="Visible in shop" />
          <Field label="Image (optional)">
            <ImageField value={value.imageUrl} onChange={(url) => setValue({ ...value, imageUrl: url })} folder="categories" aspect="aspect-square" className="max-w-[160px]" />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
