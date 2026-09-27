import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { requireModulePage } from "@/modules/shared/module-gate";
import { Container } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { truncate } from "@/lib/utils";
import { getProperty } from "@/modules/realestate/queries";
import { PropertyDetail, propertyPrice, typeLabel } from "@/modules/realestate/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSiteContext();
  requireModulePage(ctx, "realestate");
  const p = await getProperty(ctx.tenant.id, slug);
  if (!p) return { title: ctx.tenant.name };
  const title = t(p.title as LocalizedString, ctx.lang);
  const desc = t(p.description as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return {
    title: `${title} · ${ctx.tenant.name}`,
    description: desc ? truncate(desc, 160) : `${typeLabel(p.type, "en")} in ${p.location}, ${p.city} — ${propertyPrice(p, "en")}.`,
    openGraph: p.images[0] ? { images: [{ url: p.images[0] }] } : undefined,
  };
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const ctx = await getSiteContext();
  requireModulePage(ctx, "realestate");
  const p = await getProperty(ctx.tenant.id, slug);
  if (!p) notFound();
  return (
    <Container className="py-10 sm:py-14">
      <PropertyDetail property={p} ctx={ctx} />
    </Container>
  );
}
