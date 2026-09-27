import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { getTemplateMeta } from "@/templates/registry";
import { loadSections } from "@/server/site-content";
import { listTenantMedia } from "@/server/storage/media";
import { PageHeader } from "@/components/ui/card";
import { SectionEditor } from "@/components/admin/section-editor";
import { MediaPickerProvider, type PickerMedia } from "@/components/admin/shared/media-picker";

export default async function EditSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const ctx = await requireTenantAdmin();
  const meta = getTemplateMeta(ctx.tenant.templateId);
  const def = meta?.sections.find((s) => s.key === key);
  if (!meta || !def) notFound();
  const hasImages = def.fields.some((f) => f.type === "image" || f.type === "images" || (f.type === "repeater" && f.fields.some((sf) => sf.type === "image" || sf.type === "images")));
  const [state, media] = await Promise.all([loadSections(ctx.tenant.id, meta), hasImages ? listTenantMedia(ctx.tenant.id, { take: 120 }) : Promise.resolve([])]);
  // only confirmed PUBLIC files have a url; private files are never exposed here
  const pickerMedia: PickerMedia[] = media.filter((m) => m.url).map((m) => ({ id: m.id, url: m.url as string, alt: m.alt, folder: m.folder, mime: m.mime, size: m.size }));
  const enabled = state[def.key]?.enabled ?? true;
  return (
    <>
      <PageHeader
        title={def.label}
        backHref="/admin/content"
        description={enabled ? "Changes go live on your website as soon as you save." : "This section is currently turned off — it is saved but not shown on your website."}
        actions={
          <a href={`/#${def.key}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            Preview on website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        }
      />
      <MediaPickerProvider media={pickerMedia}>
        <SectionEditor
          sectionKey={def.key}
          label={def.label}
          description={def.description}
          fields={def.fields}
          initial={state[def.key]?.data ?? (def.defaults as Record<string, unknown>)}
          urduEnabled={ctx.settings.languages.urduEnabled}
        />
      </MediaPickerProvider>
    </>
  );
}
