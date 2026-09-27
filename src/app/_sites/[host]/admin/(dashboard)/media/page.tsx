import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { MediaLibrary } from "@/components/admin/shared/media-library";
import { listMedia } from "./actions";

export default async function MediaAdminPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const ctx = await requireTenantAdmin();
  const { folder } = await searchParams;
  const [folders, tenant] = await Promise.all([
    db.media.groupBy({ by: ["folder"], where: { tenantId: ctx.tenant.id, confirmed: true, visibility: "PUBLIC" }, _count: { _all: true }, orderBy: { folder: "asc" } }),
    db.tenant.findUnique({ where: { id: ctx.tenant.id }, select: { storageUsed: true, storageQuota: true } }),
  ]);
  const current = folder && folders.some((f) => f.folder === folder) ? folder : "all";
  // first page through the same action the client uses for paging/search (PUBLIC + confirmed only)
  const first = await listMedia({ folder: current === "all" ? undefined : current });
  const rows = first.ok && first.data ? first.data.rows : [];
  return (
    <>
      <PageHeader title="Media library" description="All public images uploaded to your website. Open an image to add a description, copy its address or delete it." />
      <MediaLibrary
        rows={rows}
        folders={folders.map((f) => ({ name: f.folder, count: f._count._all }))}
        current={current}
        storageUsed={Number(tenant?.storageUsed ?? 0)}
        storageQuota={Number(tenant?.storageQuota ?? 0)}
        nextCursor={first.ok && first.data ? first.data.nextCursor : undefined}
      />
    </>
  );
}
