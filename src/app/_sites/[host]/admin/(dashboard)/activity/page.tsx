import Link from "next/link";
import { ScrollText } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const PAGE = 50;

function tone(action: string) {
  if (action.endsWith(".delete") || action.includes("deactivate")) return "danger" as const;
  if (action.endsWith(".create") || action.endsWith(".publish") || action.includes("activate")) return "success" as const;
  if (action.includes("password") || action.startsWith("user.") || action.includes("login")) return "purple" as const;
  return "info" as const;
}

const VERBS: Record<string, string> = {
  save: "saved",
  create: "created",
  update: "updated",
  delete: "deleted",
  enable: "shown",
  disable: "hidden",
  reorder: "reordered",
  reset: "reset",
  publish: "published",
  unpublish: "unpublished",
  login: "signed in",
  logout: "signed out",
  password_reset: "password reset",
  password_change: "password changed",
  role: "role changed",
  activate: "activated",
  deactivate: "deactivated",
  alt: "description edited",
  status: "status changed",
  refund: "refunded",
  cancel: "cancelled",
  import: "imported",
  export: "exported",
};
const NOUNS: Record<string, string> = {
  section: "Page section",
  settings: "Settings",
  user: "User",
  media: "Image",
  product: "Product",
  category: "Category",
  order: "Order",
  food_order: "Food order",
  foodorder: "Food order",
  menu: "Menu item",
  menu_item: "Menu item",
  coupon: "Coupon",
  shipping: "Shipping zone",
  page: "Page",
  post: "Blog post",
  faq: "FAQ",
  gallery: "Gallery image",
  team: "Team member",
  service: "Service",
  testimonial: "Testimonial",
  lead: "Lead",
  job: "Job",
  application: "Application",
  booking: "Booking",
  package: "Package",
  property: "Property",
  reservation: "Reservation",
  prescription: "Prescription",
  auth: "Account",
  session: "Session",
};

/** "section.save" → "Page section saved"; unknown codes degrade to readable words. */
function humanAction(action: string): string {
  const [rawNoun, ...rest] = action.split(".");
  const verbKey = rest.join(".");
  const noun = NOUNS[rawNoun] ?? rawNoun.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const verb = VERBS[verbKey] ?? verbKey.replace(/[_.-]/g, " ");
  return verb ? `${noun} ${verb}` : noun;
}

function metaValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length > 6 ? `${v.slice(0, 6).map(metaValue).join(", ")} … (+${v.length - 6})` : v.map(metaValue).join(", ");
  return JSON.stringify(v);
}

/** yyyy-mm-dd (from a date input) → midnight in Pakistan time, or null when malformed */
function pkDay(s: string | undefined, plusDays = 0): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00+05:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string; q?: string; actor?: string; from?: string; to?: string }> }) {
  const ctx = await requireTenantAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const actor = (sp.actor ?? "").trim().slice(0, 120);
  const from = pkDay(sp.from);
  const to = pkDay(sp.to, 1); // inclusive end date
  const where: Prisma.AuditLogWhereInput = {
    tenantId: ctx.tenant.id,
    ...(sp.entity ? { entity: sp.entity.slice(0, 64) } : {}),
    ...(actor ? { actorName: actor } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { actorName: { contains: q, mode: "insensitive" } }, { entityId: { contains: q } }] } : {}),
  };
  const [rows, total, entities, actors] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["entity"], where: { tenantId: ctx.tenant.id, entity: { not: null } }, orderBy: { entity: "asc" } }),
    db.auditLog.groupBy({ by: ["actorName"], where: { tenantId: ctx.tenant.id }, orderBy: { actorName: "asc" }, take: 50 }),
  ]);
  const filtered = Boolean(q || sp.entity || actor || from || to);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (sp.entity) u.set("entity", sp.entity);
    if (actor) u.set("actor", actor);
    if (sp.from && from) u.set("from", sp.from);
    if (sp.to && to) u.set("to", sp.to);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/activity${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when. Kept for your records; entries cannot be edited or deleted." />
      <form className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" action="/admin/activity" method="get" role="search" aria-label="Filter activity">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Search" hideLabel>
            <Input name="q" type="search" defaultValue={q} placeholder="Search action, person or item id…" />
          </Field>
          <Field label="Type" hideLabel>
            <Select name="entity" defaultValue={sp.entity ?? ""} aria-label="Type">
              <option value="">All types</option>
              {entities.map((e) => (
                <option key={e.entity ?? ""} value={e.entity ?? ""}>
                  {NOUNS[(e.entity ?? "").toLowerCase()] ?? e.entity}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Person" hideLabel>
            <Select name="actor" defaultValue={actor} aria-label="Person">
              <option value="">Everyone</option>
              {actors.map((a) => (
                <option key={a.actorName} value={a.actorName}>
                  {a.actorName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From date" hideLabel>
            <Input name="from" type="date" defaultValue={from ? sp.from : ""} aria-label="From date" />
          </Field>
          <Field label="To date" hideLabel>
            <Input name="to" type="date" defaultValue={to ? sp.to : ""} aria-label="To date" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          {filtered ? (
            <Link href="/admin/activity" className={buttonVariants({ variant: "ghost" })}>
              Clear
            </Link>
          ) : null}
          <p className="ml-auto text-xs text-slate-500" role="status">
            {total === 0 ? "No entries" : `${total.toLocaleString()} entr${total === 1 ? "y" : "ies"}${filtered ? " match" : ""}`}
          </p>
        </div>
      </form>
      {rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={<ScrollText />}
            title="Nothing matches these filters"
            description="Try a wider date range or clear the filters."
            action={
              <Link href="/admin/activity" className={buttonVariants({ variant: "outline" })}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState icon={<ScrollText />} title="No activity yet" description="Changes made in this admin will be listed here." />
        )
      ) : (
        <>
          <Table responsive>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Who</TH>
                <TH>What happened</TH>
                <TH>Details</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const meta = r.meta && typeof r.meta === "object" && !Array.isArray(r.meta) ? (r.meta as Record<string, unknown>) : {};
                const entries = Object.entries(meta).filter(([, v]) => v != null && v !== "");
                return (
                  <TR key={r.id}>
                    <TD label="When" className="whitespace-nowrap text-xs text-slate-500">
                      <time dateTime={r.createdAt.toISOString()}>{formatDate(r.createdAt, true)}</time>
                    </TD>
                    <TD label="Who">
                      <p className="text-sm font-medium text-slate-900">{r.actorName}</p>
                      <p className="text-xs text-slate-400">{r.actorKind === "SUPER" ? "Platform support" : r.ip ? `from ${r.ip}` : ""}</p>
                    </TD>
                    <TD label="What happened">
                      <p className="text-sm text-slate-800">{humanAction(r.action)}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <Badge tone={tone(r.action)} className="font-mono text-[10px]">
                          {r.action}
                        </Badge>
                        {r.entityId ? (
                          <span className="font-mono text-[10px] text-slate-400" title="Item id">
                            {r.entityId}
                          </span>
                        ) : null}
                      </p>
                    </TD>
                    <TD label="Details" className="text-xs text-slate-600">
                      {entries.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <dl className="flex max-w-md flex-wrap gap-1.5 max-sm:justify-end">
                          {entries.map(([k, v]) => {
                            const text = metaValue(v);
                            const long = text.length > 80;
                            return (
                              <div key={k} className="inline-flex max-w-full items-baseline gap-1 rounded-md bg-slate-100 px-2 py-0.5" title={long ? text : undefined}>
                                <dt className="shrink-0 font-medium text-slate-500">{k.replace(/[_-]/g, " ")}:</dt>
                                <dd className="truncate text-slate-700">{long ? `${text.slice(0, 80)}…` : text}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} hrefFor={href} label="Activity pages" />
        </>
      )}
    </>
  );
}
