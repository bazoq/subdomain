import { SkeletonRegion, PageHeaderSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function SectionEditorLoading() {
  return (
    <SkeletonRegion label="Loading section editor">
      <PageHeaderSkeleton />
      <FormSkeleton fields={6} />
    </SkeletonRegion>
  );
}
