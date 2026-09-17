import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext } from "@/server/site";
import { Container } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { formatPKR, truncate } from "@/lib/utils";
import { getPackage } from "@/modules/travel/queries";
import { PackageDetail, durationText } from "@/modules/travel/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const pkg = await getPackage(ctx.tenant.id, slug);
  if (!pkg) return { title: ctx.tenant.name };
  const title = t(pkg.title as LocalizedString, ctx.lang);
  const summary = t(pkg.summary as LocalizedString, ctx.lang).replace(/\s+/g, " ").trim();
  return {
    title: `${title} · ${ctx.tenant.name}`,
    description: summary ? truncate(summary, 160) : `${title} — ${pkg.destination}, ${durationText(pkg, "en")} from ${formatPKR(pkg.price)}.`,
    openGraph: pkg.images[0] ? { images: [{ url: pkg.images[0] }] } : undefined,
  };
}

export default async function PackagePage({ params }: { params: Params }) {
  const { slug } = await params;
  const ctx = await getSiteContext();
  const pkg = await getPackage(ctx.tenant.id, slug);
  if (!pkg) notFound();
  return (
    <Container className="py-10 sm:py-14">
      <PackageDetail pkg={pkg} ctx={ctx} />
    </Container>
  );
}
