import { requireTenantAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/ui/card";
import { PostForm } from "@/components/admin/shared/post-form";

export default async function NewPostPage() {
  const ctx = await requireTenantAdmin();
  return (
    <>
      <PageHeader title="New post" backHref="/admin/posts" />
      <PostForm urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
