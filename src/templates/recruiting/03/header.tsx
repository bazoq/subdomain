"use client";

/** recruiting-03 floating glass header (client: mobile drawer). */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function GlassHeader({ ctx, cta }: { ctx: SiteContext; cta: { label: string; href: string } }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const other = ctx.lang === "ur" ? "en" : "ur";
  const langHref = `/api/lang?to=${other}&back=${encodeURIComponent(pathname)}`;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const brand = ctx.settings.branding.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-8 w-auto max-w-[140px] object-contain" />
  ) : (
    <span className="font-heading bg-gradient-to-r from-t-primary to-t-accent bg-clip-text text-xl font-extrabold tracking-tight text-transparent">{ctx.tenant.name}</span>
  );

  return (
    <header className="sticky top-0 z-50 -mb-[4.25rem] px-3 pt-3 sm:px-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-t-border/60 bg-t-bg/75 px-4 text-t-fg shadow-lg shadow-t-primary/10 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label={ctx.tenant.name}>
          {brand}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition hover:bg-t-primary/10 hover:text-t-primary", isActive(n.href) && "bg-t-primary/10 text-t-primary")}>
              {t(n.label, ctx.lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {ctx.settings.languages.urduEnabled ? (
            <a href={langHref} className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-t-primary/10 sm:inline-flex" title="Switch language">
              <Languages className="size-4" /> {other === "ur" ? "اردو" : "English"}
            </a>
          ) : null}
          <Link href={cta.href} className="hidden rounded-full bg-gradient-to-r from-t-primary to-t-secondary px-5 py-2 text-sm font-semibold text-t-primary-fg shadow-md transition hover:brightness-110 md:inline-flex">
            {cta.label}
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-t-primary/10 lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav">
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-t-dark/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-x-3 top-3 rounded-3xl bg-t-bg p-4 text-t-fg shadow-2xl transition-all", open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0")} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between px-2">
            {brand}
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-t-muted" aria-label="Close menu">
              <X className="size-6" />
            </button>
          </div>
          <nav className="mt-3 flex flex-col" aria-label="Mobile">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn("rounded-full px-4 py-3 text-base font-medium hover:bg-t-muted", isActive(n.href) && "text-t-primary")}>
                {t(n.label, ctx.lang)}
              </Link>
            ))}
            {ctx.settings.languages.urduEnabled ? (
              <a href={langHref} className="flex items-center gap-2 rounded-full px-4 py-3 text-base font-medium hover:bg-t-muted">
                <Languages className="size-5" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </nav>
          <Link href={cta.href} className="mt-3 flex justify-center rounded-full bg-gradient-to-r from-t-primary to-t-secondary px-5 py-3 font-semibold text-t-primary-fg">
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
