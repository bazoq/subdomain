import Link from "next/link";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { GalleryManager, type GalleryRow } from "@/components/admin/shared/gallery-manager";
import { asLocalized } from "@/modules/shared/content-types";
import { cn } from "@/lib/utils";

export default async function GalleryAdminPage({ searchParams }: { searchParams: Promise<{ album?: string }> }) {
  const ctx = await requireTenantAdmin();
  const { album } = await searchParams;
  const albums = (await db.galleryItem.groupBy({ by: ["album"], where: { tenantId: ctx.tenant.id }, _count: { _all: true }, orderBy: { album: "asc" } })).map((a) => ({ name: a.album, count: a._count._all }));
  const current = album && albums.some((a) => a.name === album) ? album : "all";
  const rows = await db.galleryItem.findMany({ where: { tenantId: ctx.tenant.id, ...(current !== "all" ? { album: current } : {}) }, orderBy: [{ album: "asc" }, { sortOrder: "asc" }], take: 500 });
  const total = albums.reduce((n, a) => n + a.count, 0);
  const chip = (name: string, label: string, count: number) => (
    <Link key={name} href={name === "all" ? "/admin/gallery" : `/admin/gallery?album=${encodeURIComponent(name)}`} className={cn("rounded-full border px-3 py-1 text-sm", current === name ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
      {label} <span className="opacity-70">({count})</span>
    </Link>
  );
  const mapped: GalleryRow[] = rows.map((r) => ({ id: r.id, imageUrl: r.imageUrl, caption: asLocalized(r.caption), album: r.album, sortOrder: r.sortOrder }));
  return (
    <>
      <PageHeader title="Gallery" description="Photos shown in the gallery section and at /gallery. Group them into albums (e.g. shop, products, events, transformations)." />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("all", "All", total)}
        {albums.map((a) => chip(a.name, a.name, a.count))}
      </div>
      <GalleryManager rows={mapped} albums={albums} current={current} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
