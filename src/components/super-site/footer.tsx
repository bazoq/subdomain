import Link from "next/link";
import { brand } from "@/config/brand";
import { CATEGORIES } from "@/lib/categories";

export function SuperFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-sm font-black text-white">S</span>
              <span className="font-heading text-lg font-bold text-white">{brand.name}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{brand.tagline}</p>
            <p className="mt-4 font-urdu text-sm leading-8 text-slate-400" dir="rtl">
              {brand.taglineUr}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Templates</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {CATEGORIES.slice(0, 8).map((c) => (
                <li key={c.key}>
                  <Link href={`/templates/${c.key}`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">More</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {CATEGORIES.slice(8).map((c) => (
                <li key={c.key}>
                  <Link href={`/templates/${c.key}`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Feature guides
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/super/login" className="hover:text-white">
                  Super admin
                </Link>
              </li>
            </ul>
            <div className="mt-6 text-sm text-slate-400">
              <p>{brand.supportEmail}</p>
              <p>{brand.supportPhone}</p>
              <p>{brand.address}</p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <p>Built for Pakistani businesses. Cash on delivery, WhatsApp, Urdu — everything local.</p>
        </div>
      </div>
    </footer>
  );
}
