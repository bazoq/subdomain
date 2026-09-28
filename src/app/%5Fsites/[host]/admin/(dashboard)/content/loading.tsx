import { Skeleton, SkeletonRegion, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function SectionsLoading() {
  return (
    <SkeletonRegion label="Loading page sections">
      <PageHeaderSkeleton />
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
