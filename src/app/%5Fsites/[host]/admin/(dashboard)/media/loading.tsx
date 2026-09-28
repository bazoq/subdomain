import { Skeleton, SkeletonRegion, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function MediaLoading() {
  return (
    <SkeletonRegion label="Loading media library">
      <PageHeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </SkeletonRegion>
  );
}
