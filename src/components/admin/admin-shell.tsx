"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, LogOut, Menu, X } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

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
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
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
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className={cn("flex size-9 items-center justify-center rounded-lg text-white", accent === "brand" ? "bg-brand-600" : "bg-slate-900")}>
          <Icons.LayoutDashboard className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{brandLabel}</p>
          {brandSub ? <p className="truncate text-xs text-slate-500">{brandSub}</p> : null}
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title ? <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p> : null}
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-3">
        {siteUrl ? (
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <ExternalLink className="size-4" /> View website
          </a>
        ) : null}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
          <form action={logout}>
            <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">{brandLabel}</span>
          <span className="w-8" />
        </header>

        {/* mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
              <button onClick={() => setOpen(false)} className="absolute right-2 top-3 rounded-md p-1.5 hover:bg-slate-100" aria-label="Close">
                <X className="size-5" />
              </button>
              {nav}
            </aside>
          </div>
        ) : null}

        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">{nav}</aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

function NavItem({ item, pathname, onNavigate }: { item: NavEntry; pathname: string; onNavigate: () => void }) {
  const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/super" && pathname.startsWith(item.href + "/")) || pathname === item.href;
  const [expanded, setExpanded] = React.useState(active);
  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition",
            active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          <Icon name={item.icon} className="size-4 shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{item.badge}</span> : null}
        </Link>
        {item.children?.length ? (
          <button onClick={() => setExpanded((e) => !e)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Expand">
            <ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} />
          </button>
        ) : null}
      </div>
      {item.children?.length && expanded ? (
        <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
          {item.children.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm",
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
