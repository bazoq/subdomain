import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { breadcrumbJsonLd, tenantPageMetadata } from "@/server/site-seo";
import { JsonLd } from "@/components/site/json-ld";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";
import { PrescriptionForm } from "@/modules/ecommerce/ui/prescription-form";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.uploadPrescription, ctx.lang), description: t(sui.uploadRxSub, ctx.lang), path: "/upload-prescription" });
}

/** Medical stores only (module gate → 404 elsewhere): standalone prescription upload. */
export default async function UploadPrescriptionRoute() {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  requireModulePage(ctx, "medical");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(tc, [{ name: t(ui.home, ctx.lang), path: "/" }, { name: t(ui.uploadPrescription, ctx.lang), path: "/upload-prescription" }])} />
      <PageTitle title={t(sui.uploadRxTitle, ctx.lang)} subtitle={t(sui.uploadRxSub, ctx.lang)} crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.uploadPrescription, ctx.lang) }]} />
      <div className="t-container py-8 sm:py-10">
        <PrescriptionForm ctx={toStoreCtx(ctx)} />
      </div>
    </>
  );
}
