import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContext } from "@/server/site";
import { db } from "@/server/db";
import { Container } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { GalleryGrid } from "@/modules/shared/ui/gallery-grid";

type Props = { searchParams: Promise<{ album?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.gallery, ctx.lang)} · ${ctx.tenant.name}`, description: `Photos from ${ctx.tenant.name}.` };
}

function albumLabel(a: string) {
  return a.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function GalleryPage({ searchParams }: Props) {
  const ctx = await getSiteContext();
  const { album } = await searchParams;
  const albums = (await db.galleryItem.groupBy({ by: ["album"], where: { tenantId: ctx.tenant.id }, _count: { _all: true }, orderBy: { album: "asc" } })).map((a) => ({ name: a.album, count: a._count._all }));
  const current = album && albums.some((a) => a.name === album) ? album : "all";
  const rows = await db.galleryItem.findMany({ where: { tenantId: ctx.tenant.id, ...(current !== "all" ? { album: current } : {}) }, orderBy: [{ album: "asc" }, { sortOrder: "asc" }], take: 200 });
  const title = t(ui.gallery, ctx.lang);
  const total = albums.reduce((n, a) => n + a.count, 0);
  const tab = (name: string, label: string, count: number) => (
    <Link
      key={name}
      href={name === "all" ? "/gallery" : `/gallery?album=${encodeURIComponent(name)}`}
      aria-current={current === name ? "page" : undefined}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition", current === name ? "border-t-primary bg-t-primary text-t-primary-fg" : "border-t-border hover:bg-t-muted")}
    >
      {label} <span className="text-xs opacity-70">{count}</span>
    </Link>
  );

  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="gradient" />
      <section className="py-12 sm:py-16">
        <Container>
          {albums.length > 1 ? (
            <nav aria-label="Albums" className="mb-8 flex flex-wrap gap-2">
              {tab("all", t(ui.all, ctx.lang), total)}
              {albums.map((a) => tab(a.name, albumLabel(a.name), a.count))}
            </nav>
          ) : null}
          {rows.length === 0 ? (
            <p className="t-card px-6 py-16 text-center text-t-muted-fg">{ctx.lang === "ur" ? "ابھی کوئی تصویر نہیں۔" : "No photos yet."}</p>
          ) : (
            <GalleryGrid items={rows.map((r) => ({ id: r.id, src: r.imageUrl, caption: t(r.caption as LocalizedString, ctx.lang) }))} variant="masonry" columns={3} />
          )}
        </Container>
      </section>
    </>
  );
}
