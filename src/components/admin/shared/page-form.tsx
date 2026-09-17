"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Field, Input, Switch, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionButton } from "@/components/admin/action-button";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { FormCard, FormShell } from "@/components/admin/shared/form-shell";
import { deletePage, upsertPage, type PageInput } from "@/modules/shared/pages-actions";
import { slugify } from "@/lib/utils";

export const emptyPage: PageInput = { title: { en: "" }, slug: "", content: { en: "" }, showInNav: false, enabled: true, seo: { title: "", description: "" }, sortOrder: 0 };

export function PageForm({ id, initial, urduEnabled }: { id?: string; initial?: PageInput; urduEnabled: boolean }) {
  const [value, setValue] = React.useState<PageInput>(initial ?? emptyPage);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const set = (patch: Partial<PageInput>) => {
    setValue((v) => ({ ...v, ...patch }));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    const res = await upsertPage(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setDirty(false);
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/pages/${res.data.id}`);
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
      saveLabel={id ? "Save changes" : "Create page"}
      extraActions={
        id ? (
          <ActionButton variant="ghost" className="text-red-600" confirm="Delete this page? Links to it will stop working." action={() => deletePage(id)} redirectTo="/admin/pages">
            <Trash2 /> Delete
          </ActionButton>
        ) : null
      }
      main={
        <FormCard>
          <LocalizedInput label="Page title" value={value.title} onChange={(v) => set({ title: v, slug: id ? value.slug : slugify(v.en) })} urduEnabled={urduEnabled} required error={errors["title"] ?? errors["title.en"]} placeholder="e.g. About us, Privacy policy, Return policy" />
          <LocalizedInput label="Content" value={value.content} onChange={(v) => set({ content: v })} urduEnabled={urduEnabled} multiline rows={18} error={errors["content.en"]} richHint />
        </FormCard>
      }
      side={
        <>
          <FormCard title="Visibility">
            <Switch checked={value.enabled} onChange={(v) => set({ enabled: v })} label="Page is live" />
            <Switch checked={value.showInNav} onChange={(v) => set({ showInNav: v })} label="Show in website menu" />
            <Field label="Menu order" help="Lower shows first">
              <Input type="number" min={0} value={value.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
            </Field>
            <Field label="URL slug" error={errors.slug} help={`/p/${value.slug || "…"}`}>
              <Input value={value.slug ?? ""} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder="auto from title" />
            </Field>
          </FormCard>
          <FormCard title="SEO" description="Optional. Shown in Google results and browser tab.">
            <Field label="Meta title" error={errors["seo.title"]} help={`${(value.seo?.title ?? "").length}/70`}>
              <Input maxLength={70} value={value.seo?.title ?? ""} onChange={(e) => set({ seo: { ...value.seo, title: e.target.value } })} />
            </Field>
            <Field label="Meta description" error={errors["seo.description"]} help={`${(value.seo?.description ?? "").length}/170`}>
              <Textarea maxLength={170} className="min-h-[72px]" value={value.seo?.description ?? ""} onChange={(e) => set({ seo: { ...value.seo, description: e.target.value } })} />
            </Field>
          </FormCard>
        </>
      }
    />
  );
}
