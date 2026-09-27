"use client";

/** recruiting-07 green community header: crescent logo mark, big type, prominent language switch. */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, Moon, Phone, X } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Img } from "@/templates/ui";

export function CommunityHeader({ ctx, cta }: { ctx: SiteContext; cta: { label: string; href: string } }) {
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
  const phone = ctx.settings.contact.phone;
  const brand = (
    <span className="flex items-center gap-3">
      {ctx.settings.branding.logoUrl ? (
        <Img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-10 w-auto max-w-40 object-contain brightness-0 invert" />
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-full bg-t-accent text-t-accent-fg" aria-hidden="true">
            <Moon className="size-6 -rotate-45 fill-current" />
          </span>
          <span className="font-heading text-2xl font-extrabold tracking-tight">{ctx.tenant.name}</span>
        </>
      )}
    </span>
  );
  const langBtn = (cls: string) =>
    ctx.settings.languages.urduEnabled ? (
      <a href={langHref} className={cn("inline-flex items-center gap-2 rounded-full border-2 border-t-accent px-4 py-2 text-base font-bold text-t-accent transition hover:bg-t-accent hover:text-t-accent-fg", cls)} title="Switch language">
        <Languages className="size-5" /> {other === "ur" ? "اردو" : "English"}
      </a>
    ) : null;

  return (
    <header className="sticky top-0 z-50 bg-t-primary text-t-primary-fg shadow-md">
      <div className="t-container flex h-[4.5rem] items-center justify-between gap-4 lg:h-20">
        <Link href="/" aria-label={ctx.tenant.name}>
          {brand}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn("rounded-full px-4 py-2 text-lg font-bold transition hover:bg-t-primary-fg/15", isActive(n.href) && "bg-t-primary-fg/15 underline decoration-t-accent decoration-4 underline-offset-8")}>
              {t(n.label, ctx.lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {langBtn("hidden sm:inline-flex")}
          <Link href={cta.href} className="t-btn t-btn-accent hidden px-5 py-2.5 text-base md:inline-flex">
            {cta.label}
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-12 items-center justify-center rounded-full hover:bg-t-primary-fg/15 lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav">
            <Menu className="size-7" />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col bg-t-bg text-t-fg shadow-2xl transition-transform", open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between bg-t-primary px-4 py-3 text-t-primary-fg">
            {brand}
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-t-primary-fg/15" aria-label="Close menu">
              <X className="size-7" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn("block rounded-[var(--t-radius)] px-4 py-4 text-xl font-bold hover:bg-t-muted", isActive(n.href) && "text-t-primary")}>
                {t(n.label, ctx.lang)}
              </Link>
            ))}
            <div className="mt-4 px-4">{langBtn("text-t-primary border-t-primary hover:bg-t-primary hover:text-t-primary-fg")}</div>
          </nav>
          <div className="space-y-3 border-t border-t-border p-4">
            {phone ? (
              <a href={`tel:${phone}`} className="t-btn t-btn-outline w-full text-lg text-t-primary">
                <Phone className="size-5" /> <span dir="ltr">{phone}</span>
              </a>
            ) : null}
            <Link href={cta.href} className="t-btn t-btn-primary w-full text-lg">
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
