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

export function SuperHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-50 transition", scrolled ? "border-b border-slate-200/80 bg-white/85 backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-sm font-black text-white">S</span>
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900">{brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("text-sm font-medium transition hover:text-slate-900", pathname.startsWith(l.href) ? "text-slate-900" : "text-slate-600")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/super/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Get your website <ArrowRight className="size-4" />
          </Link>
        </div>
        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </Link>
            ))}
            <Link href="/super/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">
              Sign in
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white">
              Get your website
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
