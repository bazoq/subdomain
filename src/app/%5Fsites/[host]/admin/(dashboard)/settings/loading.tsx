import { Skeleton, SkeletonRegion, PageHeaderSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <SkeletonRegion label="Loading settings">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-1 overflow-hidden lg:flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-lg lg:w-full" />
          ))}
        </div>
        <FormSkeleton fields={5} />
      </div>
    </SkeletonRegion>
  );
}
