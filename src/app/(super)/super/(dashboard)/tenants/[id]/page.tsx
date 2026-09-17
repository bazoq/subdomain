import { notFound } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/admin/action-button";
import { EditBasicsButton, DomainsPanel, TemplateChanger, UsersPanel, DangerZone } from "@/components/admin/super/tenant-panels";
import type { TemplateOption } from "@/components/admin/super/tenant-form";
import { setTenantStatus } from "@/server/super/tenants-actions";
import { getCategory } from "@/lib/categories";
import { parseSettings } from "@/lib/tenant-settings";
import { getTemplateMeta, templatesForCategory } from "@/templates/registry";
import { hostUrl, ROOT_DOMAIN } from "@/config/site";
import { formatDate } from "@/lib/utils";

function bytes(n: bigint) {
  const v = Number(n);
  if (v >= 1024 ** 3) return `${(v / 1024 ** 3).toFixed(2)} GB`;
  if (v >= 1024 ** 2) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  if (v >= 1024) return `${Math.round(v / 1024)} KB`;
  return `${v} B`;
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuper();
  const { id } = await params;
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      domains: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      users: { orderBy: [{ role: "asc" }, { createdAt: "asc" }] },
      _count: { select: { sections: true, media: true, leads: true, orders: true, foodOrders: true } },
    },
  });
  if (!tenant) notFound();

  const settings = parseSettings(tenant.settings);
  const category = getCategory(tenant.category);
  const meta = getTemplateMeta(tenant.templateId);
  const primary = tenant.domains.find((d) => d.isPrimary) ?? tenant.domains[0];
  const siteUrl = primary ? hostUrl(primary.hostname) : null;
  const adminUrl = primary ? hostUrl(primary.hostname, "/admin") : null;
  const templateOptions: TemplateOption[] = templatesForCategory(tenant.category).map((t) => ({ id: t.id, code: t.code, category: t.category, name: t.name, tagline: t.tagline, style: t.style, sectionCount: t.sections.length }));
  const hostUrlFor = Object.fromEntries(tenant.domains.map((d) => [d.hostname, hostUrl(d.hostname)]));
  const storagePct = tenant.storageQuota > BigInt(0) ? Math.min(100, Math.round((Number(tenant.storageUsed) / Number(tenant.storageQuota)) * 100)) : 0;

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={`${category?.name ?? tenant.category} · ${tenant.slug}`}
        backHref="/super/tenants"
        actions={
          <>
            {siteUrl ? (
              <a href={siteUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <ExternalLink /> Open website
                </Button>
              </a>
            ) : null}
            {adminUrl ? (
              <a href={adminUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <ShieldCheck /> Open admin
                </Button>
              </a>
            ) : null}
            <EditBasicsButton
              tenantId={tenant.id}
              initial={{
                name: tenant.name,
                status: tenant.status,
                isDemo: tenant.isDemo,
                urduEnabled: settings.languages.urduEnabled,
                contact: { phone: settings.contact.phone, whatsapp: settings.contact.whatsapp, email: settings.contact.email, city: settings.contact.city, address: settings.contact.address },
              }}
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={tenant.status} />
                  {tenant.isDemo ? <Badge tone="purple">demo</Badge> : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Change status</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {tenant.status !== "ACTIVE" ? (
                    <ActionButton size="sm" variant="success" action={() => setTenantStatus(tenant.id, "ACTIVE")}>
                      Activate
                    </ActionButton>
                  ) : null}
                  {tenant.status !== "SUSPENDED" ? (
                    <ActionButton size="sm" variant="danger" confirm="Suspend this website? Visitors will see a suspended page." action={() => setTenantStatus(tenant.id, "SUSPENDED")}>
                      Suspend
                    </ActionButton>
                  ) : null}
                  {tenant.status !== "DRAFT" ? (
                    <ActionButton size="sm" variant="outline" action={() => setTenantStatus(tenant.id, "DRAFT")}>
                      Set draft
                    </ActionButton>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Category</dt>
                <dd className="mt-1 text-slate-900">{category?.name ?? tenant.category}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Template</dt>
                <dd className="mt-1 text-slate-900">
                  {meta?.name ?? <span className="text-amber-700">not in registry</span>}
                  {meta ? <span className="ml-1 font-mono text-xs text-brand-600">#{meta.code}</span> : null} <span className="font-mono text-xs text-slate-500">{tenant.templateId}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Contact</dt>
                <dd className="mt-1 text-slate-900">
                  {[settings.contact.phone, settings.contact.whatsapp && `WA ${settings.contact.whatsapp}`, settings.contact.email, settings.contact.city].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Languages</dt>
                <dd className="mt-1 text-slate-900">English{settings.languages.urduEnabled ? " + Urdu" : ""}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Storage</dt>
                <dd className="mt-1">
                  <div className="text-slate-900">
                    {bytes(tenant.storageUsed)} of {bytes(tenant.storageQuota)} ({tenant._count.media} files)
                  </div>
                  <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                    <div className={storagePct > 90 ? "h-full bg-red-500" : "h-full bg-brand-600"} style={{ width: `${storagePct}%` }} />
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Created</dt>
                <dd className="mt-1 text-slate-900">
                  {formatDate(tenant.createdAt, true)} · updated {formatDate(tenant.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Activity</dt>
                <dd className="mt-1 text-slate-900">
                  {tenant._count.sections} sections · {tenant._count.leads} leads · {tenant._count.orders + tenant._count.foodOrders} orders
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tenant.domains.map((d) => (
              <div key={d.id} className="flex flex-col gap-0.5 rounded-lg border border-slate-100 p-2">
                <a href={hostUrl(d.hostname)} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
                  {d.hostname}
                </a>
                <a href={hostUrl(d.hostname, "/admin")} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline">
                  {d.hostname}/admin
                </a>
              </div>
            ))}
            <a href={`/super/audit?tenant=${tenant.id}`} className="block text-xs text-slate-500 underline">
              View audit log for this website
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>Hostnames that resolve to this website. At least one must remain.</CardDescription>
        </CardHeader>
        <CardContent>
          <DomainsPanel tenantId={tenant.id} domains={tenant.domains.map((d) => ({ id: d.id, hostname: d.hostname, isPrimary: d.isPrimary, createdAt: d.createdAt.toISOString() }))} rootDomain={ROOT_DOMAIN} hostUrlFor={hostUrlFor} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>
            Current: <strong>{meta?.name ?? tenant.templateId}</strong>
            {meta ? ` #${meta.code}` : ""}
            {meta ? ` — ${meta.tagline}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateChanger tenantId={tenant.id} currentId={tenant.templateId} options={templateOptions} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>People who can sign in to this website&apos;s admin. The last active owner cannot be deactivated.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersPanel tenantId={tenant.id} users={tenant.users.map((u) => ({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <DangerZone tenantId={tenant.id} tenantName={tenant.name} />
      </div>
    </>
  );
}
