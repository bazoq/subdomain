import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Server, Cloud, Lock, Languages, Banknote } from "lucide-react";
import { brand } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/components/super-site/seo";

export const metadata: Metadata = pageMetadata({
  title: `About ${brand.name}`,
  description: `${brand.name} builds and manages complete websites for Pakistani businesses: ${TOTAL_TEMPLATES} industry templates, cash on delivery, WhatsApp and Urdu built in, hosted and maintained for you.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">About {brand.name}</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">Websites that work the way Pakistani businesses do</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Most website builders are made for card payments, English-only audiences and owners who enjoy fiddling with layouts. {brand.name} is different: {TOTAL_TEMPLATES} templates designed around {CATEGORIES.length} real business types, cash on delivery, WhatsApp and Urdu built in, and a managed setup so you never touch DNS or hosting.
        </p>
        <p className="mt-4 font-urdu text-lg leading-9 text-slate-700" dir="rtl" lang="ur">
          {brand.taglineUr}
        </p>
      </div>

      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          { icon: Banknote, t: "Local by default", d: "COD checkout, PKR pricing, Pakistani cities and phone formats, Umrah packages, marla and kanal, Eid sales." },
          { icon: Languages, t: "English and Urdu", d: "A single toggle turns on Urdu with proper right-to-left layout and Nastaliq type." },
          { icon: ShieldCheck, t: "Isolated and secure", d: "Every website's data, media and users are separated. Private files such as CVs and prescriptions are never public." },
          { icon: Cloud, t: "Modern infrastructure", d: "Hosted on a global edge network with automatic SSL, a managed Postgres database and object storage." },
          { icon: Server, t: "One platform, many sites", d: "Each domain or subdomain is its own website with its own template and admin panel, managed centrally." },
          { icon: Lock, t: "Owner control", d: "You get an admin login for your domain. Change anything, any time, or ask us to do it." },
        ].map((f) => (
          <li key={f.t} className="rounded-2xl border border-slate-200 bg-white p-6">
            <f.icon className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-3 font-semibold text-slate-900">{f.t}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{f.d}</p>
          </li>
        ))}
      </ul>

      <section className="mt-16 rounded-3xl bg-slate-950 p-10 text-white" aria-labelledby="about-cta">
        <h2 id="about-cta" className="font-heading text-2xl font-bold">
          Ready to see your business online?
        </h2>
        <p className="mt-2 text-slate-300">Browse the templates for your industry or send us a message.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/templates" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">
            Browse templates
          </Link>
          <Link href="/contact" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
