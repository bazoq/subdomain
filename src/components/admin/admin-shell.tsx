"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, ExternalLink, Languages, LogOut, Menu, X } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { useFocusTrap } from "@/components/ui/dialog";

export interface NavEntry {
  label: string;
  href: string;
  icon: string; // lucide icon name
  badge?: number;
  children?: { label: string; href: string }[];
}

export interface NavGroup {
  title?: string;
  items: NavEntry[];
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} aria-hidden="true" />;
}

const ROOTS = ["/admin", "/super"];

function isActive(href: string, pathname: string) {
  if (pathname === href) return true;
  if (ROOTS.includes(href)) return false;
  return pathname.startsWith(href + "/");
}

/** Breadcrumb trail for the current path, derived from the nav tree (longest matching href wins). */
export function breadcrumbsFor(groups: NavGroup[], pathname: string): { label: string; href: string }[] {
  let best: { item: NavEntry; child?: { label: string; href: string } } | null = null;
  let bestLen = -1;
  for (const g of groups) {
    for (const item of g.items) {
      if (isActive(item.href, pathname) && item.href.length > bestLen) {
        best = { item };
        bestLen = item.href.length;
      }
      for (const c of item.children ?? []) {
        if (isActive(c.href, pathname) && c.href.length > bestLen) {
          best = { item, child: c };
          bestLen = c.href.length;
        }
      }
    }
  }
  if (!best) return [];
  const root = groups[0]?.items[0];
  const crumbs: { label: string; href: string }[] = [];
  if (root && best.item.href !== root.href) crumbs.push({ label: root.label, href: root.href });
  crumbs.push({ label: best.item.label, href: best.item.href });
  if (best.child && best.child.href !== best.item.href) crumbs.push({ label: best.child.label, href: best.child.href });
  // deeper detail pages (e.g. /admin/orders/123) get a generic trailing crumb
  const last = crumbs[crumbs.length - 1];
  if (last && pathname !== last.href) {
    const tail = pathname.slice(last.href.length + 1).split("/")[0] ?? "";
    crumbs.push({ label: tail === "new" ? "New" : "Details", href: pathname });
  }
  return crumbs;
}

export function AdminShell({
  groups,
  brandLabel,
  brandSub,
  siteUrl,
  userName,
  userRole,
  logout,
  children,
  accent = "brand",
  urduEnabled = false,
}: {
  groups: NavGroup[];
  brandLabel: string;
  brandSub?: string;
  siteUrl?: string;
  userName: string;
  userRole: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
  accent?: "brand" | "dark";
  /** shows the "Preview website in English / Urdu" switch (tenant admin only) */
  urduEnabled?: boolean;
}) {
  const pathname = usePathname();
  // the drawer is "open" only for the path it was opened on, so any navigation closes it
  const [openedAt, setOpenedAt] = React.useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (v: boolean) => setOpenedAt(v ? pathname : null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const drawerId = React.useId();
  const close = React.useCallback(() => setOpenedAt(null), []);
  useFocusTrap(drawerRef, open, { onEscape: close });

  const crumbs = React.useMemo(() => breadcrumbsFor(groups, pathname), [groups, pathname]);
  const sectionLabel = crumbs[crumbs.length - 1]?.label ?? brandLabel;

  const nav = (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", accent === "brand" ? "bg-brand-600" : "bg-slate-900")} aria-hidden="true">
          <Icons.LayoutDashboard className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{brandLabel}</p>
          {brandSub ? <p className="truncate text-xs text-slate-500">{brandSub}</p> : null}
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title ? (
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400" id={`${drawerId}-g${gi}`}>
                {g.title}
              </p>
            ) : null}
            <ul className="space-y-0.5" aria-labelledby={g.title ? `${drawerId}-g${gi}` : undefined}>
              {g.items.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onNavigate={close} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-3">
        {siteUrl ? (
          <a href={siteUrl} target="_blank" rel="noreferrer" className="mb-2 flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <ExternalLink className="size-4" aria-hidden="true" /> View website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        {urduEnabled ? <LangPreview className="mb-2" /> : null}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-slate-50">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-10 items-center justify-center rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls={drawerId}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-slate-900">{sectionLabel}</p>
            {sectionLabel !== brandLabel ? <p className="truncate text-[11px] text-slate-500">{brandLabel}</p> : null}
          </div>
          {siteUrl ? (
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="View website (opens in a new tab)"
            >
              <ExternalLink className="size-5" aria-hidden="true" />
            </a>
          ) : (
            <span className="w-10" />
          )}
        </header>

        {/* mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={close} aria-hidden="true" />
            <div
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-white shadow-xl outline-none"
            >
              <button
                type="button"
                onClick={close}
                data-dialog-close
                className="absolute right-2 top-3 flex size-10 items-center justify-center rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
              {nav}
            </div>
          </div>
        ) : null}

        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">{nav}</aside>

        <div className="lg:ml-64">
          {/* desktop title bar */}
          <div className="hidden items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-2.5 lg:flex">
            <Breadcrumbs crumbs={crumbs} rootLabel={brandLabel} />
            <div className="flex items-center gap-2">
              {urduEnabled ? <LangPreview compact /> : null}
              {siteUrl ? (
                <a href={siteUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <ExternalLink className="size-4" aria-hidden="true" /> View website
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          </div>
          <main id="main-content" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

function Breadcrumbs({ crumbs, rootLabel }: { crumbs: { label: string; href: string }[]; rootLabel: string }) {
  if (crumbs.length === 0) return <span className="text-sm font-medium text-slate-700">{rootLabel}</span>;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-slate-500">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex min-w-0 items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-slate-300" aria-hidden="true" /> : null}
              {last ? (
                <span className="truncate font-medium text-slate-900" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate rounded hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * "Preview website in English / اردو": sets the public site's language cookie (same host)
 * and opens the site in a new tab, so the owner can check Urdu content without leaving the admin.
 */
function LangPreview({ compact, className }: { compact?: boolean; className?: string }) {
  const link = (lang: "en" | "ur", label: string) => (
    <a
      href={`/api/lang?to=${lang}&back=/`}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex min-h-8 items-center justify-center rounded px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        lang === "ur" && "font-urdu",
      )}
      aria-label={`Preview website in ${lang === "ur" ? "Urdu" : "English"} (opens in a new tab)`}
    >
      {label}
    </a>
  );
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1", compact ? "" : "justify-between", className)}>
      <span className="flex items-center gap-1.5 px-1 text-xs text-slate-500">
        <Languages className="size-3.5" aria-hidden="true" /> Preview
      </span>
      <span className="flex items-center">
        {link("en", "EN")}
        <span className="text-slate-300" aria-hidden="true">
          |
        </span>
        {link("ur", "اردو")}
      </span>
    </div>
  );
}

function NavItem({ item, pathname, onNavigate }: { item: NavEntry; pathname: string; onNavigate: () => void }) {
  const active = isActive(item.href, pathname);
  // auto-expanded while active; a manual toggle overrides that until the route changes
  const [manual, setManual] = React.useState<{ path: string; open: boolean } | null>(null);
  const expanded = manual?.path === pathname ? manual.open : active;
  const setExpanded = (fn: (e: boolean) => boolean) => setManual({ path: pathname, open: fn(expanded) });
  const subId = React.useId();
  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={pathname === item.href ? "page" : undefined}
          className={cn(
            "flex min-h-10 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          <Icon name={item.icon} className="size-4 shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white" aria-label={`${item.badge} new`}>
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </Link>
        {item.children?.length ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex size-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label} submenu`}
            aria-expanded={expanded}
            aria-controls={subId}
          >
            <ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {item.children?.length && expanded ? (
        <ul id={subId} className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
          {item.children.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                onClick={onNavigate}
                aria-current={pathname === c.href ? "page" : undefined}
                className={cn(
                  "block min-h-9 rounded-md px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  pathname === c.href ? "font-medium text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
