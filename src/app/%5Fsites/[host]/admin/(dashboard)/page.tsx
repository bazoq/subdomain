import Link from "next/link";
import { ShoppingBag, Banknote, Inbox, Package, ChefHat, Briefcase, Plane, Building2, Users, AlertTriangle, CheckCircle2, Circle, LayoutTemplate, Newspaper, ImagePlus, Settings, ExternalLink, Plus, CalendarClock } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatPKR, formatDate, PK_TIME_ZONE } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Midnight today in Pakistan time (dashboards are read by owners in PKT regardless of server zone). */
function startOfTodayPK(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: PK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${ymd}T00:00:00+05:00`);
}

type ChecklistItem = { key: string; label: string; done: boolean; href: string; hint?: string };
type QuickAction = { label: string; href: string; icon: React.ReactNode; external?: boolean };

export default async function TenantDashboard() {
  const ctx = await requireTenantAdmin();
  const tid = ctx.tenant.id;
  const has = (m: string) => ctx.category.modules.includes(m as never);
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const today = startOfTodayPK();

  const [leadsNew, leadsToday, recentLeads, sectionRows] = await Promise.all([
    db.lead.count({ where: { tenantId: tid, status: "NEW" } }),
    db.lead.count({ where: { tenantId: tid, createdAt: { gte: today } } }),
    db.lead.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.siteSection.count({ where: { tenantId: tid } }),
  ]);

  const cards: React.ReactNode[] = [];
  const todayCards: React.ReactNode[] = [];
  const checklist: ChecklistItem[] = [];
  const quick: QuickAction[] = [];
  let recent: React.ReactNode = null;

  if (has("ecommerce")) {
    const [pending, revenue, products, lowStock, recentOrders, todayAgg] = await Promise.all([
      db.order.count({ where: { tenantId: tid, status: "PENDING" } }),
      db.order.aggregate({ where: { tenantId: tid, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true }, _count: true }),
      db.product.count({ where: { tenantId: tid, isActive: true } }),
      db.product.count({ where: { tenantId: tid, trackStock: true, stock: { lte: ctx.settings.commerce.lowStockThreshold } } }),
      db.order.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 6 }),
      db.order.aggregate({ where: { tenantId: tid, createdAt: { gte: today }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true }, _count: true }),
    ]);
    todayCards.push(
      <StatCard key="t-orders" label="Orders today" value={todayAgg._count} icon={<ShoppingBag />} tone={todayAgg._count ? "info" : "default"} />,
      <StatCard key="t-rev" label="Sales today" value={formatPKR(todayAgg._sum.total ?? 0)} icon={<Banknote />} tone={todayAgg._sum.total ? "success" : "default"} />,
    );
    cards.push(
      <StatCard key="pending" label="Pending orders" value={pending} icon={<ShoppingBag />} tone="warning" hint="Awaiting confirmation" />,
      <StatCard key="rev" label="Revenue (30 days)" value={formatPKR(revenue._sum.total ?? 0)} icon={<Banknote />} tone="success" hint={`${revenue._count} orders`} />,
      <StatCard key="prod" label="Active products" value={products} icon={<Package />} tone="info" />,
      <StatCard key="low" label="Low stock" value={lowStock} icon={<AlertTriangle />} tone={lowStock ? "danger" : "default"} hint={lowStock ? "Restock soon" : undefined} />,
    );
    checklist.push({ key: "product", label: "Add your first product", done: products > 0, href: "/admin/products/new" });
    quick.push({ label: "Add product", href: "/admin/products/new", icon: <Plus /> }, { label: "Pending orders", href: "/admin/orders?status=PENDING", icon: <ShoppingBag /> });
    recent = (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {recentOrders.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet. Share your website link to get the first one.</p> : null}
          {recentOrders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  #{ctx.settings.commerce.orderPrefix}-{o.number} · {o.customerName}
                </p>
                <p className="text-xs text-slate-500">
                  {o.city} · {formatDate(o.createdAt, true)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold">{formatPKR(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (has("restaurant")) {
    const LIVE = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] as const;
    const [live, revenue, items, recentOrders, todayAgg] = await Promise.all([
      db.foodOrder.count({ where: { tenantId: tid, status: { in: [...LIVE] } } }),
      db.foodOrder.aggregate({ where: { tenantId: tid, createdAt: { gte: since }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
      db.menuItem.count({ where: { tenantId: tid, isAvailable: true } }),
      db.foodOrder.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 6 }),
      db.foodOrder.aggregate({ where: { tenantId: tid, createdAt: { gte: today }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
    ]);
    todayCards.push(
      <StatCard key="t-food" label="Orders today" value={todayAgg._count} icon={<ChefHat />} tone={todayAgg._count ? "info" : "default"} />,
      <StatCard key="t-food-rev" label="Sales today" value={formatPKR(todayAgg._sum.total ?? 0)} icon={<Banknote />} tone={todayAgg._sum.total ? "success" : "default"} />,
    );
    cards.push(
      <StatCard key="live" label="Live orders" value={live} icon={<ChefHat />} tone="warning" hint="In the kitchen queue" />,
      <StatCard key="rev" label="Sales (30 days)" value={formatPKR(revenue._sum.total ?? 0)} icon={<Banknote />} tone="success" hint={`${revenue._count} orders`} />,
      <StatCard key="items" label="Menu items available" value={items} icon={<Package />} tone="info" />,
      <StatCard key="status" label="Accepting orders" value={ctx.settings.restaurant.acceptingOrders ? "Yes" : "Paused"} tone={ctx.settings.restaurant.acceptingOrders ? "success" : "danger"} hint={ctx.settings.restaurant.acceptingOrders ? undefined : "Turn on in Settings → Restaurant"} />,
    );
    checklist.push({ key: "menu", label: "Add your first menu item", done: items > 0, href: "/admin/menu/new" });
    quick.push({ label: "Add menu item", href: "/admin/menu/new", icon: <Plus /> }, { label: "Live orders board", href: "/admin/kitchen", icon: <ChefHat /> });
    recent = (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/admin/kitchen" className="text-sm text-brand-600 hover:underline">
            Open live board
          </Link>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {recentOrders.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet. Share your website link to get the first one.</p> : null}
          {recentOrders.map((o) => (
            <Link key={o.id} href={`/admin/food-orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  #{o.number} · {o.customerName} · {o.type.replace(/_/g, " ").toLowerCase()}
                </p>
                <p className="text-xs text-slate-500">{formatDate(o.createdAt, true)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold">{formatPKR(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (has("recruiting")) {
    const [jobs, apps, newApps, appsToday] = await Promise.all([
      db.job.count({ where: { tenantId: tid, isActive: true } }),
      db.application.count({ where: { tenantId: tid, createdAt: { gte: since } } }),
      db.application.count({ where: { tenantId: tid, status: "RECEIVED" } }),
      db.application.count({ where: { tenantId: tid, createdAt: { gte: today } } }),
    ]);
    todayCards.push(<StatCard key="t-apps" label="Applications today" value={appsToday} icon={<Users />} tone={appsToday ? "info" : "default"} />);
    cards.push(
      <StatCard key="jobs" label="Open jobs" value={jobs} icon={<Briefcase />} tone="info" />,
      <StatCard key="apps" label="Applications (30 days)" value={apps} icon={<Users />} tone="success" />,
      <StatCard key="new" label="New applications" value={newApps} icon={<Inbox />} tone="warning" />,
    );
    checklist.push({ key: "job", label: "Post your first job", done: jobs > 0, href: "/admin/jobs/new" });
    quick.push({ label: "Post a job", href: "/admin/jobs/new", icon: <Plus /> }, { label: "Applications", href: "/admin/applications", icon: <Users /> });
  }
  if (has("travel")) {
    const [pk, bookings, bookingsToday] = await Promise.all([
      db.travelPackage.count({ where: { tenantId: tid, isActive: true } }),
      db.booking.count({ where: { tenantId: tid, status: "NEW" } }),
      db.booking.count({ where: { tenantId: tid, createdAt: { gte: today } } }),
    ]);
    todayCards.push(<StatCard key="t-bk" label="Booking requests today" value={bookingsToday} icon={<Plane />} tone={bookingsToday ? "info" : "default"} />);
    cards.push(
      <StatCard key="pk" label="Active packages" value={pk} icon={<Plane />} tone="info" />,
      <StatCard key="bk" label="New booking requests" value={bookings} icon={<Inbox />} tone="warning" />,
    );
    checklist.push({ key: "package", label: "Add your first package", done: pk > 0, href: "/admin/packages/new" });
    quick.push({ label: "Add package", href: "/admin/packages/new", icon: <Plus /> }, { label: "Bookings", href: "/admin/bookings", icon: <Plane /> });
  }
  if (has("realestate")) {
    const props = await db.property.count({ where: { tenantId: tid, isActive: true } });
    cards.push(<StatCard key="props" label="Active listings" value={props} icon={<Building2 />} tone="info" />);
    checklist.push({ key: "property", label: "Add your first listing", done: props > 0, href: "/admin/properties/new" });
    quick.push({ label: "Add listing", href: "/admin/properties/new", icon: <Plus /> });
  }
  if (has("services") && !has("ecommerce") && !has("restaurant")) {
    const services = await db.service.count({ where: { tenantId: tid } });
    checklist.push({ key: "service", label: "Add your first service", done: services > 0, href: "/admin/services/new" });
    quick.push({ label: "Add service", href: "/admin/services/new", icon: <Plus /> });
  }
  todayCards.push(<StatCard key="t-leads" label="Messages today" value={leadsToday} icon={<Inbox />} tone={leadsToday ? "info" : "default"} />);
  cards.push(<StatCard key="leads" label="New leads / messages" value={leadsNew} icon={<Inbox />} tone={leadsNew ? "warning" : "default"} hint={leadsNew ? "Reply soon — fast replies win customers" : undefined} />);

  // setup checklist (only what is not module-specific goes here; module items were pushed above)
  const s = ctx.settings;
  checklist.unshift(
    { key: "logo", label: "Upload your logo", done: Boolean(s.branding.logoUrl), href: "/admin/settings?tab=branding" },
    { key: "contact", label: "Add your phone and WhatsApp number", done: Boolean(s.contact.phone && s.contact.whatsapp), href: "/admin/settings?tab=contact", hint: "Visitors call or WhatsApp you from every page" },
    { key: "sections", label: "Edit your page sections", done: sectionRows > 0, href: "/admin/content", hint: "Replace the template's sample text and photos" },
  );
  checklist.push(
    { key: "hours", label: "Set opening hours", done: s.hours.length > 0, href: "/admin/settings?tab=hours" },
    { key: "seo", label: "Write a title and description for Google", done: Boolean(s.seo.title && s.seo.description), href: "/admin/settings?tab=seo" },
  );
  const doneCount = checklist.filter((c) => c.done).length;
  const allDone = doneCount === checklist.length;

  quick.push(
    { label: "Edit page sections", href: "/admin/content", icon: <LayoutTemplate /> },
    { label: "Write a blog post", href: "/admin/posts/new", icon: <Newspaper /> },
    { label: "Upload images", href: "/admin/media", icon: <ImagePlus /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings /> },
    { label: "View website", href: "/", icon: <ExternalLink />, external: true },
  );

  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: PK_TIME_ZONE, hour: "numeric", hour12: false }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader title={`${greeting}, ${ctx.user.name.split(" ")[0]}`} description={`${ctx.tenant.name} · ${ctx.category.name} · ${formatDate(new Date())}`} />

      <section aria-labelledby="quick-actions" className="mb-6">
        <h2 id="quick-actions" className="sr-only">
          Quick actions
        </h2>
        <ul className="flex flex-wrap gap-2">
          {quick.map((a) => (
            <li key={a.href + a.label}>
              {a.external ? (
                <a href={a.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&_svg]:size-4">
                  {a.icon} {a.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <Link href={a.href} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&_svg]:size-4">
                  {a.icon} {a.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      {!allDone ? (
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Finish setting up your website</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {doneCount} of {checklist.length} done
              </p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={doneCount}>
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.round((doneCount / checklist.length) * 100)}%` }} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {checklist.map((c) => (
                <li key={c.key}>
                  <Link href={c.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                    {c.done ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle className="size-5 shrink-0 text-slate-300" aria-hidden="true" />}
                    <span className="min-w-0 flex-1">
                      <span className={c.done ? "text-sm text-slate-500 line-through" : "text-sm font-medium text-slate-800"}>{c.label}</span>
                      <span className="sr-only">{c.done ? " (done)" : " (to do)"}</span>
                      {c.hint && !c.done ? <span className="block text-xs text-slate-500">{c.hint}</span> : null}
                    </span>
                    {!c.done ? <span className="text-xs font-medium text-brand-600">Do it</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="today-heading" className="mb-6">
        <h2 id="today-heading" className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <CalendarClock className="size-4" aria-hidden="true" /> Today (Pakistan time)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{todayCards}</div>
      </section>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {recent ? <div className="lg:col-span-2">{recent}</div> : null}
        <Card className={recent ? undefined : "lg:col-span-3"}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Latest messages</CardTitle>
            <Link href="/admin/leads" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {recentLeads.length === 0 ? <p className="p-5 text-sm text-slate-500">No messages yet. Contact-form and WhatsApp-button enquiries appear here.</p> : null}
            {recentLeads.map((l) => (
              <Link key={l.id} href={`/admin/leads/${l.id}`} className="block px-5 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-slate-900">{l.name}</p>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t(l.subject) || l.message || l.formKey}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(l.createdAt, true)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
