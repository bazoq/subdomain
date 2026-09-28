import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageForm } from "@/components/admin/shared/page-form";
import { asLocalized, asSeo } from "@/modules/shared/content-types";
import type { PageInput } from "@/modules/shared/pages-actions";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantAdmin();
  const row = await db.sitePage.findFirst({ where: { id, tenantId: ctx.tenant.id } });
  if (!row) notFound();
  const seo = asSeo(row.seo);
  const initial: PageInput = { title: asLocalized(row.title), slug: row.slug, content: asLocalized(row.content), showInNav: row.showInNav, enabled: row.enabled, seo: { title: seo.title ?? "", description: seo.description ?? "" }, sortOrder: row.sortOrder };
  return (
    <>
      <PageHeader
        title={initial.title.en}
        backHref="/admin/pages"
        actions={
          <Link href={`/p/${row.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink /> View on site
          </Link>
        }
      />
      <PageForm id={row.id} initial={initial} urduEnabled={ctx.settings.languages.urduEnabled} />
    </>
  );
}
