import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { loadTemplateComponents } from "@/templates/registry";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  const seo = ctx.sections.seo?.data as { title?: string; description?: string } | undefined;
  return {
    title: seo?.title || undefined,
    description: seo?.description || undefined,
  };
}

export default async function HomePage() {
  const ctx = await getSiteContext();
  const { Home } = await loadTemplateComponents(ctx.template.id);
  return <Home ctx={ctx} />;
}
