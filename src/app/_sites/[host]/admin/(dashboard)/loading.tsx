import { SkeletonRegion, PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

/** Generic admin page placeholder (used by every dashboard route without its own loading.tsx). */
export default function AdminLoading() {
  return (
    <SkeletonRegion label="Loading page">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="mt-6">
        <TableSkeleton rows={6} cols={4} />
      </div>
    </SkeletonRegion>
  );
}
