"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Languages, Menu, X } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type HeaderNavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export function HeaderNav({
  items,
  brand,
  cta,
  rightSlot,
  lang,
  urduEnabled,
  variant = "light",
  sticky = true,
  className,
}: {
  items: HeaderNavItem[];
  brand: { name: string; logoUrl?: string; tagline?: string };
  cta?: { label: string; href: string; external?: boolean };
  rightSlot?: React.ReactNode;
  lang: "en" | "ur";
  urduEnabled: boolean;
  variant?: "light" | "dark" | "transparent";
  sticky?: boolean;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  // close the drawer on navigation (state adjustment during render, no effect needed)
  const [prevPath, setPrevPath] = React.useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }
  React.useEffect(() => {
    if (variant !== "transparent") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const dark = variant === "dark" || (variant === "transparent" && !scrolled);
  const other = lang === "ur" ? "en" : "ur";
  const langHref = `/api/lang?to=${other}&back=${encodeURIComponent(pathname)}`;

  return (
    <header
      className={cn(
        "z-50 w-full transition-colors",
        sticky && "sticky top-0",
        variant === "light" && "border-b border-t-border bg-t-bg/95 text-t-fg backdrop-blur",
        variant === "dark" && "bg-t-dark text-t-dark-fg",
        variant === "transparent" && (scrolled ? "border-b border-t-border bg-t-bg/95 text-t-fg shadow-sm backdrop-blur" : "absolute inset-x-0 top-0 bg-transparent text-white"),
        className,
      )}
    >
      <div className="t-container flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={brand.name}>
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="h-9 w-auto max-w-[160px] object-contain lg:h-11" />
          ) : (
            <span className="font-heading truncate text-xl font-extrabold tracking-tight lg:text-2xl">{brand.name}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t(ui.mainNavigation, lang)}>
          {items.map((it) =>
            it.children?.length ? (
              <div key={it.href} className="group relative">
                <Link href={it.href} className={cn("inline-flex items-center gap-1 rounded-[var(--t-radius)] px-3 py-2 text-sm font-medium transition", dark ? "hover:bg-white/10" : "hover:bg-t-muted", isActive(it.href) && "text-t-primary")}>
                  {it.label} <ChevronDown className="size-3.5" aria-hidden="true" />
                </Link>
                <div className="invisible absolute start-0 top-full pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="t-card min-w-48 py-2 text-t-fg shadow-lg">
                    {it.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block px-4 py-2 text-sm hover:bg-t-muted hover:text-t-primary">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={cn("rounded-[var(--t-radius)] px-3 py-2 text-sm font-medium transition", dark ? "hover:bg-white/10" : "hover:bg-t-muted", isActive(it.href) && "text-t-primary")}
              >
                {it.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {urduEnabled ? (
            <a href={langHref} className={cn("hidden items-center gap-1 rounded-[var(--t-radius)] px-2.5 py-2 text-sm font-medium sm:inline-flex", dark ? "hover:bg-white/10" : "hover:bg-t-muted")} title={t(ui.switchLanguage, lang)} hrefLang={other} lang={other}>
              <Languages className="size-4" /> {other === "ur" ? "اردو" : "English"}
            </a>
          ) : null}
          {rightSlot}
          {cta ? (
            cta.external ? (
              <a href={cta.href} target="_blank" rel="noreferrer" className="t-btn t-btn-primary hidden px-4 py-2.5 text-sm md:inline-flex">
                {cta.label}
              </a>
            ) : (
              <Link href={cta.href} className="t-btn t-btn-primary hidden px-4 py-2.5 text-sm md:inline-flex">
                {cta.label}
              </Link>
            )
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn("inline-flex size-10 items-center justify-center rounded-[var(--t-radius)] lg:hidden", dark ? "hover:bg-white/10" : "hover:bg-t-muted")}
            aria-label={t(ui.openMenu, lang)}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col bg-t-bg text-t-fg shadow-2xl transition-transform", open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")} role="dialog" aria-modal="true" aria-label={t(ui.menu, lang)}>
          <div className="flex items-center justify-between border-b border-t-border px-4 py-3">
            <span className="font-heading text-lg font-bold">{brand.name}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-[var(--t-radius)] p-2 hover:bg-t-muted" aria-label={t(ui.closeMenu, lang)}>
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label={t(ui.mainNavigation, lang)}>
            {items.map((it) => (
              <div key={it.href}>
                <Link href={it.href} className={cn("block rounded-[var(--t-radius)] px-3 py-3 text-base font-medium hover:bg-t-muted", isActive(it.href) && "text-t-primary")}>
                  {it.label}
                </Link>
                {it.children?.map((c) => (
                  <Link key={c.href} href={c.href} className="block rounded-[var(--t-radius)] px-3 py-2 ps-7 text-sm text-t-muted-fg hover:bg-t-muted">
                    {c.label}
                  </Link>
                ))}
              </div>
            ))}
            {urduEnabled ? (
              <a href={langHref} className="mt-2 flex items-center gap-2 rounded-[var(--t-radius)] px-3 py-3 text-base font-medium hover:bg-t-muted" title={t(ui.switchLanguage, lang)} hrefLang={other} lang={other}>
                <Languages className="size-5" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </nav>
          {cta ? (
            <div className="border-t border-t-border p-4">
              {cta.external ? (
                <a href={cta.href} target="_blank" rel="noreferrer" className="t-btn t-btn-primary w-full">
                  {cta.label}
                </a>
              ) : (
                <Link href={cta.href} className="t-btn t-btn-primary w-full">
                  {cta.label}
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
