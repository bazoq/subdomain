import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { Container } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { getTeam } from "@/modules/shared/queries";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { TeamCard } from "@/modules/shared/ui/team-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";

function pageTitle(ctx: Awaited<ReturnType<typeof getSiteContext>>) {
  const k = ctx.category.key;
  if (k === "law") return t(ui.attorneys, ctx.lang);
  if (k === "gym") return t(ui.trainers, ctx.lang);
  if (k === "realestate") return ctx.lang === "ur" ? "ہمارے ایجنٹس" : "Our agents";
  return t(ui.team, ctx.lang);
}

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: pageTitle(ctx), description: `Meet the people behind ${ctx.tenant.name}.`, path: "/team" });
}

export default async function TeamPage() {
  const ctx = await getSiteContext();
  const rows = await getTeam(ctx.tenant.id, 100);
  const title = pageTitle(ctx);
  const variant = ctx.category.key === "law" ? "wide" : "card";
  return (
    <>
      <PageHero ctx={ctx} title={title} breadcrumbs={[{ label: title }]} variant="gradient" />
      <section className="py-14 sm:py-20">
        <Container>
          {rows.length === 0 ? (
            <p className="t-card px-6 py-16 text-center text-t-muted-fg">{ctx.lang === "ur" ? "ابھی کوئی ممبر شامل نہیں۔" : "No team members have been added yet."}</p>
          ) : (
            <div className={variant === "wide" ? "grid gap-6 lg:grid-cols-2" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {rows.map((m) => (
                <TeamCard key={m.id} ctx={ctx} member={m} variant={variant} />
              ))}
            </div>
          )}
        </Container>
      </section>
      <CtaBlock ctx={ctx} />
    </>
  );
}
