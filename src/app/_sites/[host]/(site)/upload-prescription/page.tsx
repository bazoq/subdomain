import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";
import { PrescriptionForm } from "@/modules/ecommerce/ui/prescription-form";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.uploadPrescription, ctx.lang)} · ${ctx.tenant.name}` };
}

/** Medical stores only: standalone prescription upload. */
export default async function UploadPrescriptionRoute() {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("medical")) notFound();
  return (
    <>
      <PageTitle title={t(sui.uploadRxTitle, ctx.lang)} subtitle={t(sui.uploadRxSub, ctx.lang)} crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.uploadPrescription, ctx.lang) }]} />
      <div className="t-container py-8 sm:py-10">
        <PrescriptionForm ctx={toStoreCtx(ctx)} />
      </div>
    </>
  );
}
