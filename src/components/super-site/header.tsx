"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/templates", label: "Templates" },
  { href: "/blog", label: "Guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

/**
 * Marketing-site header. Accessibility: landmark nav with a label, `aria-current` on the active link,
 * a real disclosure button for the mobile menu (aria-expanded / aria-controls), Escape closes it, and it
 * closes on navigation. The "Sign in" link was removed: business owners sign in at their own domain's
 * /admin, and the platform owner's /super/login stays in the footer.
 */
export function SuperHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const menuId = React.useId();
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={cn("sticky top-0 z-50 transition", scrolled || open ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`${brand.name} home`}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-sm font-black text-white" aria-hidden>
            S
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900">{brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn("rounded-md text-sm font-medium transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500", isActive(l.href) ? "text-slate-900 underline decoration-brand-500 decoration-2 underline-offset-8" : "text-slate-600")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
            Get your website <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>
      <div id={menuId} hidden={!open} className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
        <nav className="flex flex-col gap-1" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2 text-base font-medium hover:bg-slate-50", isActive(l.href) ? "bg-slate-50 text-slate-900" : "text-slate-700")}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white">
            Get your website
          </Link>
        </nav>
      </div>
    </header>
  );
}
