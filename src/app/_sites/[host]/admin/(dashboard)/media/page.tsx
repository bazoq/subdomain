import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { listTenantMedia } from "@/server/storage/media";
import { PageHeader } from "@/components/ui/card";
import { MediaLibrary, type MediaRow } from "@/components/admin/shared/media-library";

const TAKE = 60;

export default async function MediaAdminPage({ searchParams }: { searchParams: Promise<{ folder?: string; cursor?: string }> }) {
  const ctx = await requireTenantAdmin();
  const { folder, cursor } = await searchParams;
  const [folders, tenant] = await Promise.all([
    db.media.groupBy({ by: ["folder"], where: { tenantId: ctx.tenant.id, confirmed: true, visibility: "PUBLIC" }, _count: { _all: true }, orderBy: { folder: "asc" } }),
    db.tenant.findUnique({ where: { id: ctx.tenant.id }, select: { storageUsed: true, storageQuota: true } }),
  ]);
  const current = folder && folders.some((f) => f.folder === folder) ? folder : "all";
  const list = await listTenantMedia(ctx.tenant.id, { folder: current === "all" ? undefined : current, take: TAKE + 1, cursor });
  const hasMore = list.length > TAKE;
  const rows: MediaRow[] = list.slice(0, TAKE).map((m) => ({ id: m.id, url: m.url ?? "", mime: m.mime, size: m.size, folder: m.folder, alt: m.alt, createdAt: m.createdAt.toISOString() }));
  return (
    <>
      <PageHeader title="Media library" description="All public images uploaded to your website. Copy a URL to reuse an image anywhere." />
      <MediaLibrary
        rows={rows}
        folders={folders.map((f) => ({ name: f.folder, count: f._count._all }))}
        current={current}
        storageUsed={Number(tenant?.storageUsed ?? 0)}
        storageQuota={Number(tenant?.storageQuota ?? 0)}
        nextCursor={hasMore ? rows[rows.length - 1]?.id : undefined}
      />
    </>
  );
}
