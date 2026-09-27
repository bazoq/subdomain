"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Field, Input, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "@/components/admin/uploader";
import { ActionButton } from "@/components/admin/action-button";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { LocalizedListEditor } from "@/components/admin/shared/list-editor";
import { FormCard, FormShell } from "@/components/admin/shared/form-shell";
import { deleteService, upsertService, type ServiceInput } from "@/modules/shared/services-actions";
import { slugify } from "@/lib/utils";

export const emptyService: ServiceInput = { name: { en: "" }, slug: "", summary: { en: "" }, description: { en: "" }, priceFrom: "", priceNote: "", imageUrl: "", icon: "", features: [], isFeatured: false, isActive: true, sortOrder: 0 };

export function ServiceForm({ id, initial, urduEnabled, entityLabel = "Service", showPricing = true, imageFolder = "services" }: { id?: string; initial?: ServiceInput; urduEnabled: boolean; entityLabel?: string; showPricing?: boolean; imageFolder?: string }) {
  const [value, setValue] = React.useState<ServiceInput>(initial ?? emptyService);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const set = (patch: Partial<ServiceInput>) => {
    setValue((v) => ({ ...v, ...patch }));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    const res = await upsertService(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setDirty(false);
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/services/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  return (
    <FormShell
      onSave={save}
      saving={saving}
      dirty={dirty}
      saveLabel={id ? "Save changes" : `Create ${entityLabel.toLowerCase()}`}
      extraActions={
        id ? (
          <ActionButton variant="ghost" className="text-red-600" confirm={`Delete this ${entityLabel.toLowerCase()}? This cannot be undone.`} action={() => deleteService(id)} redirectTo="/admin/services">
            <Trash2 /> Delete
          </ActionButton>
        ) : null
      }
      main={
        <>
          <FormCard title="Basics">
            <LocalizedInput label="Name" value={value.name} onChange={(v) => set({ name: v, slug: value.slug || (id ? value.slug : slugify(v.en)) })} urduEnabled={urduEnabled} required error={errors["name"] ?? errors["name.en"]} placeholder="e.g. Business cards" />
            <LocalizedInput label="Short summary" value={value.summary} onChange={(v) => set({ summary: v })} urduEnabled={urduEnabled} multiline rows={2} error={errors["summary.en"]} help="One or two lines shown on cards and listings." />
            <LocalizedInput label="Full description" value={value.description} onChange={(v) => set({ description: v })} urduEnabled={urduEnabled} multiline rows={8} error={errors["description.en"]} richHint />
          </FormCard>
          <FormCard title="Highlights" description={showPricing ? "Bullet points shown on the card and detail page. For printing shops you may also enter quantity price tiers as JSON in the description." : "Bullet points shown on the detail page."}>
            <LocalizedListEditor label="Feature list" value={value.features} onChange={(v) => set({ features: v })} urduEnabled={urduEnabled} placeholder="e.g. Same-day delivery in Lahore" max={30} addLabel="Add point" />
          </FormCard>
        </>
      }
      side={
        <>
          <FormCard title="Visibility">
            <Switch checked={value.isActive} onChange={(v) => set({ isActive: v })} label="Show on website" />
            <Switch checked={value.isFeatured} onChange={(v) => set({ isFeatured: v })} label="Featured (shown on home page)" />
            <Field label="Display order" help="Lower numbers show first">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
            </Field>
            <Field label="URL slug" error={errors.slug} help={`/services/${value.slug || "…"}`}>
              <Input value={value.slug ?? ""} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder="auto from name" />
            </Field>
          </FormCard>
          {showPricing ? (
            <FormCard title="Pricing">
              <Field label="Starting price (Rs)" error={errors.priceFrom} help="Leave blank to hide the price">
                <Input type="number" min={0} inputMode="numeric" value={value.priceFrom === null || value.priceFrom === undefined ? "" : value.priceFrom} onChange={(e) => set({ priceFrom: e.target.value === "" ? "" : Number(e.target.value) })} />
              </Field>
              <Field label="Price note" error={errors.priceNote}>
                <Input value={value.priceNote ?? ""} onChange={(e) => set({ priceNote: e.target.value })} placeholder="e.g. per 1,000 pcs" maxLength={120} />
              </Field>
            </FormCard>
          ) : null}
          <FormCard title="Image & icon">
            <ImageField label="Service image" value={value.imageUrl ?? ""} onChange={(url) => set({ imageUrl: url })} folder={imageFolder} aspect="aspect-[4/3]" />
            <Field label="Icon" error={errors.icon} help="Lucide icon name (lucide.dev/icons), e.g. Scale, Printer, Gavel">
              <Input value={value.icon ?? ""} onChange={(e) => set({ icon: e.target.value })} placeholder="Sparkles" />
            </Field>
          </FormCard>
        </>
      }
    />
  );
}
