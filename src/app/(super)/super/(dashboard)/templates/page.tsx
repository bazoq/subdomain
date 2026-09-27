import { LayoutTemplate, ExternalLink } from "lucide-react";
import { requireSuperPage } from "@/server/super/access";
import { db } from "@/server/db";
import { PageHeader, EmptyState, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateControls } from "@/components/admin/super/template-controls";
import { TEMPLATES } from "@/templates/registry";
import { CATEGORIES } from "@/lib/categories";
import { hostUrl, subdomainHost } from "@/config/site";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  await requireSuperPage(["SUPERADMIN"]);
  const [settings, usage] = await Promise.all([db.templateSetting.findMany(), db.tenant.groupBy({ by: ["templateId"], where: { isDemo: false }, _count: true })]);
  const settingById = new Map(settings.map((s) => [s.templateId, s]));
  const usageById = new Map(usage.map((u) => [u.templateId, u._count]));

  if (TEMPLATES.length === 0) {
    return (
      <>
        <PageHeader title="Templates" description="Code templates registered in the platform." />
        <EmptyState
          icon={<LayoutTemplate />}
          title="No templates registered yet"
          description="Templates live in src/templates/{category}/{nn}. Run `npm run gen:templates` to regenerate the registry, then redeploy. Demo sites are created by `npm run db:seed`."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Templates" description={`${TEMPLATES.length} templates across ${CATEGORIES.length} categories. Disabled templates are hidden from the public gallery; featured ones appear on the home page.`} />
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const list = TEMPLATES.filter((t) => t.category === cat.key).sort((a, b) => (settingById.get(a.id)?.sortOrder ?? 0) - (settingById.get(b.id)?.sortOrder ?? 0) || a.id.localeCompare(b.id));
          if (list.length === 0) return null;
          return (
            <section key={cat.key}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                {cat.name} <span className="text-sm font-normal text-slate-500">({list.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((t) => {
                  const s = settingById.get(t.id);
                  const enabled = s?.enabled ?? true;
                  const featured = s?.featured ?? false;
                  const demoUrl = hostUrl(subdomainHost(`demo-${t.id}`));
                  return (
                    <Card key={t.id} className={enabled ? "" : "opacity-60"}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle>
                              {t.name} <span className="font-mono text-sm font-normal text-brand-600">#{t.code}</span>
                            </CardTitle>
                            <CardDescription>{t.tagline}</CardDescription>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] text-slate-400">{t.id}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {t.style.map((st) => (
                            <Badge key={st}>{st}</Badge>
                          ))}
                          {featured ? <Badge tone="brand">featured</Badge> : null}
                          {!enabled ? <Badge tone="danger">disabled</Badge> : null}
                        </div>
                        <p className="text-xs text-slate-500">
                          {t.features.length} features · {t.sections.length} sections · used by {usageById.get(t.id) ?? 0} website{(usageById.get(t.id) ?? 0) === 1 ? "" : "s"}
                        </p>
                        <a href={demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                          {subdomainHost(`demo-${t.id}`)} <ExternalLink className="size-3" />
                        </a>
                        <TemplateControls templateId={t.id} enabled={enabled} featured={featured} sortOrder={s?.sortOrder ?? 0} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
