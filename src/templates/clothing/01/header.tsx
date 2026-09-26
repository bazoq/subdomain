"use client";

/** clothing-01 editorial header: tiny uppercase nav left, centred serif logotype, icons right; hides on scroll down, returns on scroll up. */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import type { SiteContext } from "@/templates/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CartButton } from "@/modules/ecommerce/ui/cart-button";

export function EditorialHeader({ ctx }: { ctx: SiteContext }) {
  const pathname = usePathname() ?? "/";
  // drawer state is keyed by pathname so navigating closes it without an effect
  const [openAt, setOpenAt] = React.useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 8) {
        setHidden(y > last && y > 120);
        last = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const lang = ctx.lang;
  const other = lang === "ur" ? "en" : "ur";
  const langHref = `/api/lang?to=${other}&back=${encodeURIComponent(pathname)}`;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const navLink = "text-[10px] font-semibold uppercase tracking-[0.28em] transition hover:text-t-accent";

  return (
    <header className={cn("sticky top-0 z-50 border-b border-t-border bg-t-bg/95 backdrop-blur transition-transform duration-300", hidden && "-translate-y-full")}>
      <div className="t-container grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 lg:h-20">
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {ctx.nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn(navLink, isActive(n.href) && "text-t-accent")}>
              {t(n.label, lang)}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center justify-self-start hover:text-t-accent lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav">
          <Menu className="size-5" />
        </button>

        <Link href="/" className="justify-self-center" aria-label={ctx.tenant.name}>
          {ctx.settings.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ctx.settings.branding.logoUrl} alt={ctx.tenant.name} className="h-8 w-auto max-w-[200px] object-contain lg:h-10" />
          ) : (
            <span className="font-heading text-xl font-normal uppercase tracking-[0.35em] text-t-fg lg:text-2xl">{ctx.tenant.name}</span>
          )}
        </Link>

        <div className="flex items-center justify-end gap-1">
          {ctx.settings.languages.urduEnabled ? (
            <a href={langHref} className="hidden items-center gap-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] hover:text-t-accent sm:inline-flex" title="Switch language">
              <Languages className="size-4" /> {other === "ur" ? "اردو" : "English"}
            </a>
          ) : null}
          <CartButton ctx={{ lang }} mode="drawer" className="rounded-none hover:bg-transparent hover:text-t-accent" />
        </div>
      </div>

      {/* mobile drawer */}
      <div id="mobile-nav" className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 start-0 flex w-[85%] max-w-sm flex-col bg-t-bg text-t-fg transition-transform", open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full")} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between border-b border-t-border px-5 py-4">
            <span className="font-heading text-base uppercase tracking-[0.3em]">{ctx.tenant.name}</span>
            <button type="button" onClick={() => setOpen(false)} className="p-2 hover:text-t-accent" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile">
            {ctx.nav.map((n) => (
              <Link key={n.href} href={n.href} className={cn("block border-b border-t-border py-4 text-xs font-semibold uppercase tracking-[0.25em] hover:text-t-accent", isActive(n.href) && "text-t-accent")}>
                {t(n.label, lang)}
              </Link>
            ))}
            {ctx.settings.languages.urduEnabled ? (
              <a href={langHref} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] hover:text-t-accent">
                <Languages className="size-4" /> {other === "ur" ? "اردو" : "English"}
              </a>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
