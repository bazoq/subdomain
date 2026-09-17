"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Field, Input, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "@/components/admin/uploader";
import { ActionButton } from "@/components/admin/action-button";
import { LocalizedInput } from "@/components/admin/shared/localized-input";
import { FormCard, FormShell } from "@/components/admin/shared/form-shell";
import { deletePost, upsertPost, type PostInput } from "@/modules/shared/posts-actions";
import { slugify } from "@/lib/utils";

export const emptyPost: PostInput = { title: { en: "" }, slug: "", excerpt: { en: "" }, content: { en: "" }, coverUrl: "", published: false, publishedAt: "" };

export function PostForm({ id, initial, urduEnabled }: { id?: string; initial?: PostInput; urduEnabled: boolean }) {
  const [value, setValue] = React.useState<PostInput>(initial ?? emptyPost);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const set = (patch: Partial<PostInput>) => {
    setValue((v) => ({ ...v, ...patch }));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    const res = await upsertPost(id ?? null, value);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setDirty(false);
      setErrors({});
      if (!id && res.data?.id) router.push(`/admin/posts/${res.data.id}`);
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
      saveLabel={id ? "Save changes" : value.published ? "Publish post" : "Save draft"}
      extraActions={
        id ? (
          <ActionButton variant="ghost" className="text-red-600" confirm="Delete this post? This cannot be undone." action={() => deletePost(id)} redirectTo="/admin/posts">
            <Trash2 /> Delete
          </ActionButton>
        ) : null
      }
      main={
        <>
          <FormCard>
            <LocalizedInput label="Title" value={value.title} onChange={(v) => set({ title: v, slug: id ? value.slug : slugify(v.en) })} urduEnabled={urduEnabled} required error={errors["title"] ?? errors["title.en"]} placeholder="e.g. Eid offer: 20% off all orders" />
            <LocalizedInput label="Excerpt" value={value.excerpt} onChange={(v) => set({ excerpt: v })} urduEnabled={urduEnabled} multiline rows={2} error={errors["excerpt.en"]} help="Short teaser shown in listings and search results." />
            <LocalizedInput label="Content" value={value.content} onChange={(v) => set({ content: v })} urduEnabled={urduEnabled} multiline rows={16} error={errors["content.en"]} richHint />
          </FormCard>
        </>
      }
      side={
        <>
          <FormCard title="Publishing">
            <Switch checked={value.published} onChange={(v) => set({ published: v })} label={value.published ? "Published" : "Draft (hidden)"} />
            <Field label="Publish date" error={errors.publishedAt} help="Blank = now when first published">
              <Input type="date" value={value.publishedAt ?? ""} onChange={(e) => set({ publishedAt: e.target.value })} />
            </Field>
            <Field label="URL slug" error={errors.slug} help={`/blog/${value.slug || "…"}`}>
              <Input value={value.slug ?? ""} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder="auto from title" />
            </Field>
          </FormCard>
          <FormCard title="Cover image">
            <ImageField value={value.coverUrl ?? ""} onChange={(url) => set({ coverUrl: url })} folder="posts" aspect="aspect-video" />
          </FormCard>
        </>
      }
    />
  );
}
