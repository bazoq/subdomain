"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/super-site/wordmark";

const links = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Guides" },
  { href: "/about", label: "About" },
];

/**
 * Marketing-site header (dark glass). Accessibility: landmark nav with a label, `aria-current` on the active
 * link, a real disclosure button for the mobile menu (aria-expanded / aria-controls), Escape closes it, and it
 * closes on navigation. Business owners sign in at their own domain's /admin; /super/login is in the footer.
 */
export function SuperHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  // The menu is "open" only for the path it was opened on, so any navigation closes it without an effect.
  const [openedAt, setOpenedAt] = React.useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = React.useCallback((v: boolean | ((prev: boolean) => boolean)) => setOpenedAt((prev) => ((typeof v === "function" ? v(prev === pathname) : v) ? pathname : null)), [pathname]);
  const menuId = React.useId();
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={cn("sticky top-0 z-50 transition-colors duration-300", scrolled || open ? "border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400" aria-label={`${brand.name} home`}>
          <Wordmark name={brand.name} />
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
                isActive(l.href) ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:from-gold-200 hover:to-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          >
            Get your website <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="rounded-full p-2 text-zinc-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>
      <div id={menuId} hidden={!open} className="border-t border-white/[0.06] bg-ink-950/95 px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
        <nav className="flex flex-col gap-1" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn("rounded-xl px-3 py-3 text-lg font-display", isActive(l.href) ? "bg-white/[0.06] text-white" : "text-zinc-300 hover:bg-white/[0.04]")}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} className="mt-3 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-3 text-center text-sm font-semibold text-ink-950">
            Get your website
          </Link>
        </nav>
      </div>
    </header>
  );
}
