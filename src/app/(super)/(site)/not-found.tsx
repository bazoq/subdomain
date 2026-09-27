import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };

/** Branded 404 for the marketing site (inside header/footer). Also reached via the (site)/[...rest] catch-all. */
export default function SiteNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-heading text-7xl font-black text-slate-200" aria-hidden>
        404
      </p>
      <h1 className="font-heading mt-2 text-3xl font-bold text-slate-900">We could not find that page</h1>
      <p className="mt-3 text-slate-600">The link may be old or mistyped. Here is where most people want to go:</p>
      <p className="mt-2 font-urdu text-base leading-8 text-slate-600" dir="rtl" lang="ur">
        یہ صفحہ موجود نہیں ہے۔
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/templates" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Browse all templates <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/pricing" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Pricing
        </Link>
        <Link href="/contact" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Contact {brand.name}
        </Link>
      </div>
      <nav aria-label="Template categories" className="mt-12">
        <ul className="flex flex-wrap justify-center gap-2 text-sm">
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <Link href={`/templates/${c.key}`} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
