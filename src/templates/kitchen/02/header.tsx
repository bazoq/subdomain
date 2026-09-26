"use client";

/** kitchen-02 two-tier retail header: utility top bar, main bar with a big GET /shop?q= search, category mega-strip. */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { ls, t, ui } from "@/lib/i18n";
import { cn, whatsappLink } from "@/lib/utils";

/** chrome labels for assistive tech (the platform ui dictionary has no menu strings) */
const A11Y = { open: ls("Open menu", "مینیو کھولیں"), close: ls("Close menu", "مینیو بند کریں"), menu: ls("Menu", "مینیو"), lang: ls("Switch language", "زبان بدلیں") };
import { Img } from "@/templates/ui";
import { CartButton } from "@/modules/ecommerce/ui/cart-button";
import { sui } from "@/modules/ecommerce/ui/strings";

export function RetailHeader({ ctx, categories }: { ctx: SiteContext; categories: { label: string; href: string }[] }) {
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

  const lang = ctx.lang;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const other = lang === "ur" ? "en" : "ur";
  const langHref = `/api/lang?to=${other}&back=${encodeURIComponent(pathname)}`;
  const phone = ctx.settings.contact.phone;
  const wa = ctx.settings.contact.whatsapp || phone;

  const searchForm = (id: string, cls?: string) => (
    <form action="/shop" method="get" role="search" className={cn("relative flex items-center", cls)}>
      <label htmlFor={id} className="sr-only">
        {t(ui.search, lang)}
      </label>
      <input id={id} name="q" type="search" placeholder={t(sui.searchPlaceholder, lang)} className="t-input h-11 w-full ps-10 text-sm" />
      <Search className="pointer-events-none absolute start-3 size-4 text-t-muted-fg" aria-hidden="true" />
      <button type="submit" className="t-btn t-btn-primary ms-2 h-11 shrink-0 px-5 text-sm font-bold uppercase">
        {t(ui.search, lang)}
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-t-bg shadow-sm">
      {/* tier 1 — utility bar */}
      <div className="bg-t-dark text-t-dark-fg">
        <div className="t-container flex h-9 items-center justify-between gap-4 text-xs">
          <p className="truncate font-medium">{ctx.settings.contact.city || ctx.tenant.name}</p>
          <div className="flex items-center gap-4">
            {phone ? (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 font-semibold hover:text-t-accent">
                <Phone className="size-3.5" /> <span dir="ltr">{phone}</span>
              </a>
            ) : null}
            {wa ? (
              <a href={whatsappLink(wa)} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 font-semibold hover:text-t-accent sm:inline-flex">
                <MessageCircle className="size-3.5" /> {t(ui.whatsapp, lang)}
              </a>
            ) : null}
            {ctx.settings.languages.urduEnabled ? (
              <a href={langHref} className="inline-flex items-center gap-1 font-semibold hover:text-t-accent" title={t(A11Y.lang, lang)}>
                <Languages className="size-3.5" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* tier 2 — logo, search, cart */}
      <div className="border-b-2 border-t-border">
        <div className="t-container flex h-16 items-center gap-4 lg:h-20 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label={ctx.tenant.name}>
            {ctx.settings.branding.logoUrl ? (
              <Img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} loading="eager" className="h-9 w-auto max-w-36 object-contain lg:h-12" />
            ) : (
              <span className="font-heading text-xl font-extrabold uppercase tracking-tight text-t-primary lg:text-2xl">{ctx.tenant.name}</span>
            )}
          </Link>
          {searchForm("shop-q-desktop", "hidden flex-1 md:flex")}
          <div className="ms-auto flex items-center gap-1 md:ms-0">
            <CartButton ctx={{ lang }} mode="drawer" showLabel className="rounded-[var(--t-radius)] bg-t-primary px-3 text-t-primary-fg hover:bg-t-primary/90 [&>span]:bg-t-accent [&>span]:text-t-accent-fg" />
            <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-[var(--t-radius)] hover:bg-t-muted lg:hidden" aria-label={t(A11Y.open, lang)} aria-expanded={open} aria-controls="mobile-nav">
              <Menu className="size-6" />
            </button>
          </div>
        </div>
        <div className="t-container pb-3 md:hidden">{searchForm("shop-q-mobile")}</div>
      </div>

      {/* tier 3 — category mega-strip */}
      <div className="hidden border-b-4 border-t-primary bg-t-muted lg:block">
        <div className="t-container flex items-center gap-1 overflow-x-auto py-1">
          {ctx.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn("shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:text-t-primary", isActive(n.href) && "text-t-primary")}
            >
              {t(n.label, lang)}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-t-border" aria-hidden="true" />
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="shrink-0 px-3 py-2 text-xs font-semibold text-t-muted-fg transition hover:text-t-primary">
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* mobile drawer */}
      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col bg-t-bg text-t-fg shadow-2xl transition-transform", open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")} role="dialog" aria-modal="true" aria-label={t(A11Y.menu, lang)}>
          <div className="flex items-center justify-between border-b-2 border-t-border px-4 py-3">
            <span className="font-heading text-lg font-extrabold uppercase text-t-primary">{ctx.tenant.name}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-[var(--t-radius)] p-2 hover:bg-t-muted" aria-label={t(A11Y.close, lang)}>
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label={t(A11Y.menu, lang)}>
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn("block px-3 py-3 text-base font-bold uppercase hover:bg-t-muted", isActive(n.href) && "text-t-primary")}>
                {t(n.label, lang)}
              </Link>
            ))}
            {categories.length ? (
              <div className="mt-3 border-t border-t-border pt-3">
                {categories.map((c) => (
                  <Link key={c.href} href={c.href} className="block px-3 py-2.5 text-sm font-medium text-t-muted-fg hover:bg-t-muted hover:text-t-primary">
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {ctx.settings.languages.urduEnabled ? (
              <a href={langHref} className="mt-3 flex items-center gap-2 border-t border-t-border px-3 py-3 text-base font-bold hover:bg-t-muted">
                <Languages className="size-5" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </nav>
          {phone ? (
            <div className="border-t-2 border-t-border p-4">
              <a href={`tel:${phone}`} className="t-btn t-btn-primary w-full font-bold uppercase">
                <Phone className="size-4" /> <span dir="ltr">{phone}</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
