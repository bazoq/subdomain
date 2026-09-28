import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { brand } from "@/config/brand";
import { CATEGORIES } from "@/lib/categories";
import { Wordmark } from "@/components/super-site/wordmark";

export function SuperFooter() {
  const year = new Date().getFullYear();
  const half = Math.ceil(CATEGORIES.length / 2);
  return (
    <footer className="relative border-t border-white/[0.06] bg-ink-950 text-zinc-400">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Wordmark name={brand.name} />
            <p className="mt-5 max-w-xs text-sm leading-6">{brand.tagline}</p>
            <p className="mt-3 font-urdu text-sm leading-8 text-zinc-500" dir="rtl" lang="ur">
              {brand.taglineUr}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li>
                <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle className="size-4 text-gold-400" aria-hidden /> {brand.supportPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${brand.supportEmail}`} className="inline-flex items-center gap-2 hover:text-white">
                  <Mail className="size-4 text-gold-400" aria-hidden /> {brand.supportEmail}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-gold-400" aria-hidden /> {brand.address}
              </li>
            </ul>
          </div>
          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8" aria-label="Footer">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200">Templates</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {CATEGORIES.slice(0, half).map((c) => (
                  <li key={c.key}>
                    <Link href={`/templates/${c.key}`} className="hover:text-white">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200">More industries</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {CATEGORIES.slice(half).map((c) => (
                  <li key={c.key}>
                    <Link href={`/templates/${c.key}`} className="hover:text-white">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200">Company</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  ["/templates", "All templates"],
                  ["/pricing", "Pricing"],
                  ["/blog", "Feature guides"],
                  ["/about", "About"],
                  ["/contact", "Contact"],
                  ["/super/login", "Super admin"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-zinc-600 sm:flex-row sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <p>Built for Pakistani businesses — cash on delivery, WhatsApp and Urdu, everything local.</p>
        </div>
      </div>
    </footer>
  );
}
