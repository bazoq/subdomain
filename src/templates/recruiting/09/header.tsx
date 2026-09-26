"use client";

/** recruiting-09 dark tech header with a green terminal-style ">_" logo mark. */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Img } from "@/templates/ui";

export function TerminalHeader({ ctx, cta }: { ctx: SiteContext; cta: { label: string; href: string } }) {
  const pathname = usePathname() ?? "/";
  // drawer state is keyed by pathname so navigating closes it without an effect
  const [openAt, setOpenAt] = React.useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const other = ctx.lang === "ur" ? "en" : "ur";
  const langHref = `/api/lang?to=${other}&back=${encodeURIComponent(pathname)}`;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const brand = (
    <span className="flex items-center gap-2.5">
      {ctx.settings.branding.logoUrl ? (
        <Img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-9 w-auto max-w-40 object-contain" />
      ) : (
        <>
          <span className="rounded-[var(--t-radius)] border border-t-primary/50 bg-t-primary/10 px-2 py-1 font-mono text-base font-bold text-t-primary" aria-hidden="true">
            &gt;_
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">{ctx.tenant.name}</span>
        </>
      )}
    </span>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-t-border bg-t-dark/90 text-t-dark-fg backdrop-blur">
      <div className="t-container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={ctx.tenant.name}>
          {brand}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn("rounded-[var(--t-radius)] px-3 py-2 font-mono text-sm transition hover:bg-white/5 hover:text-t-primary", isActive(n.href) && "text-t-primary")}>
              <span className="text-t-muted-fg">/</span>
              {t(n.label, ctx.lang).toLowerCase()}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {ctx.settings.languages.urduEnabled ? (
            <a href={langHref} className="hidden items-center gap-1 rounded-[var(--t-radius)] px-2.5 py-2 font-mono text-sm hover:bg-white/5 sm:inline-flex" title="Switch language">
              <Languages className="size-4" /> {other === "ur" ? "اردو" : "en"}
            </a>
          ) : null}
          <Link href={cta.href} className="t-btn t-btn-primary hidden px-4 py-2 font-mono text-sm md:inline-flex">
            {cta.label}
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-[var(--t-radius)] hover:bg-white/5 lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav">
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col border-s border-t-border bg-t-dark text-t-dark-fg shadow-2xl transition-transform", open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between border-b border-t-border px-4 py-3">
            {brand}
            <button type="button" onClick={() => setOpen(false)} className="rounded-[var(--t-radius)] p-2 hover:bg-white/5" aria-label="Close menu">
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3 font-mono" aria-label="Mobile">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn("block rounded-[var(--t-radius)] px-3 py-3 text-base hover:bg-white/5", isActive(n.href) && "text-t-primary")}>
                <span className="text-t-muted-fg">/</span>
                {t(n.label, ctx.lang).toLowerCase()}
              </Link>
            ))}
            {ctx.settings.languages.urduEnabled ? (
              <a href={langHref} className="mt-2 flex items-center gap-2 rounded-[var(--t-radius)] px-3 py-3 text-base hover:bg-white/5">
                <Languages className="size-5" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </nav>
          <div className="border-t border-t-border p-4">
            <Link href={cta.href} className="t-btn t-btn-primary w-full font-mono">
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
