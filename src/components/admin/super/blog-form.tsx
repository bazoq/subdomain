"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea, Help } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageField } from "@/components/admin/uploader";
import { useToast } from "@/components/ui/toast";
import { MarkdownPreview } from "@/components/admin/super/markdown-preview";
import { upsertBlogPost, deleteBlogPost, type BlogPostInput } from "@/server/super/blog-actions";
import { CATEGORIES } from "@/lib/categories";
import { slugify, cn } from "@/lib/utils";

const empty: BlogPostInput = {
  category: "general",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  tags: [],
  published: false,
  publishedAt: "",
  authorName: "SiteForge Team",
};

function toLocalInput(d: string | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BlogForm({ id, initial }: { id?: string; initial?: BlogPostInput }) {
  const [v, setV] = React.useState<BlogPostInput>(initial ? { ...initial, publishedAt: toLocalInput(initial.publishedAt) } : empty);
  const [tagsText, setTagsText] = React.useState((initial?.tags ?? []).join(", "));
  const [slugTouched, setSlugTouched] = React.useState(Boolean(id));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [tab, setTab] = React.useState<"write" | "preview">("write");
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    setErrors({});
    const payload: BlogPostInput = {
      ...v,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : "",
    };
    const res = await upsertBlogPost(id ?? null, payload);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      if (!id && res.data) router.push(`/super/blog/${res.data.id}`);
      else router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  async function remove() {
    if (!id || !window.confirm("Delete this post permanently?")) return;
    const res = await deleteBlogPost(id);
    if (res.ok) {
      toast.push("success", res.message ?? "Deleted");
      router.push("/super/blog");
    } else toast.push("error", res.message);
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4">
            <Field label="Title" error={errors.title} required>
              <Input
                value={v.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setV({ ...v, title, slug: slugTouched ? v.slug : slugify(title) });
                }}
              />
            </Field>
            <Field label="Slug" error={errors.slug} required help="URL: /blog/{category}/{slug}">
              <Input
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setV({ ...v, slug: e.target.value.toLowerCase() });
                }}
              />
            </Field>
            <Field label="Excerpt" error={errors.excerpt} required>
              <Textarea value={v.excerpt} onChange={(e) => setV({ ...v, excerpt: e.target.value })} className="min-h-[72px]" maxLength={400} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Content (Markdown)</CardTitle>
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-md px-3 py-1 capitalize", tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {tab === "write" ? (
              <>
                <Textarea value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} className="min-h-[420px] font-mono text-[13px]" placeholder={"## Heading\n\nParagraph with **bold**, *italic*, `code` and [links](https://example.com).\n\n- bullet\n- bullet"} />
                {errors.content ? <p className="mt-1 text-xs font-medium text-red-600">{errors.content}</p> : null}
                <Help>Supports headings, paragraphs, bold, italics, links, images, lists, quotes and code blocks.</Help>
              </>
            ) : (
              <MarkdownPreview source={v.content} className="min-h-[420px]" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Category" error={errors.category} required>
              <Select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
                <option value="general">General</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Switch checked={v.published} onChange={(published) => setV({ ...v, published })} label="Published" />
            <Field label="Publish date" error={errors.publishedAt} help="Leave empty to use now when publishing.">
              <Input type="datetime-local" value={v.publishedAt ?? ""} onChange={(e) => setV({ ...v, publishedAt: e.target.value })} />
            </Field>
            <Field label="Author" error={errors.authorName}>
              <Input value={v.authorName} onChange={(e) => setV({ ...v, authorName: e.target.value })} />
            </Field>
            <Field label="Tags" error={errors.tags} help="Comma separated.">
              <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="seo, ecommerce, pakistan" />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cover image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageField value={v.coverUrl ?? ""} onChange={(coverUrl) => setV({ ...v, coverUrl })} folder="blog" />
            {errors.coverUrl ? <p className="mt-1 text-xs font-medium text-red-600">{errors.coverUrl}</p> : null}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between gap-2">
          {id ? (
            <Button type="button" variant="ghost" className="text-red-600" onClick={remove}>
              <Trash2 /> Delete
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={saving}>
            {id ? "Save changes" : "Create post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
