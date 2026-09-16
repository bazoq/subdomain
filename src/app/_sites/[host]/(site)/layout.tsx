import { getSiteContext } from "@/server/site";
import { loadTemplateComponents } from "@/templates/registry";
import { SuspendedSite } from "@/components/site/suspended";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSiteContext();
  if (ctx.tenant.status === "SUSPENDED") return <SuspendedSite name={ctx.tenant.name} />;
  const { Layout } = await loadTemplateComponents(ctx.template.id);
  return <Layout ctx={ctx}>{children}</Layout>;
}
