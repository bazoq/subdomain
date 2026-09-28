import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { t, ui } from "@/lib/i18n";
import { PageHero } from "@/modules/shared/ui/page-hero";
import { ClassTimetable } from "@/modules/gym/ui/class-timetable";
import { TeamBlock } from "@/modules/shared/ui/team-block";
import { CtaBlock } from "@/modules/shared/ui/section-blocks";

export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.classes, ctx.lang), description: `Weekly class timetable at ${ctx.tenant.name}.`, path: "/classes" });
}

export default async function ClassesPage() {
  const ctx = await getSiteContext();
  if (!ctx.category.modules.includes("gym")) notFound();
  const title = t(ui.classes, ctx.lang);
  return (
    <>
      <PageHero ctx={ctx} title={title} subtitle={ctx.lang === "ur" ? "ہفتہ وار ٹائم ٹیبل – دن منتخب کریں" : "Weekly timetable – pick a day to see what's on."} breadcrumbs={[{ label: title }]} variant="gradient" />
      <ClassTimetable ctx={ctx} heading={{ eyebrow: undefined, title: undefined }} className="pt-10" />
      <TeamBlock ctx={ctx} variant="circle" columns={4} className="bg-t-muted" heading={{ eyebrow: ctx.lang === "ur" ? "کوچز" : "Coaches", title: { en: "Meet the trainers", ur: "ہمارے ٹرینرز" } }} />
      <CtaBlock ctx={ctx} />
    </>
  );
}
