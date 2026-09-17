import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { LeadForm } from "@/components/super-site/lead-form";

export const metadata: Metadata = { title: "Pricing", description: "Simple pricing for a complete business website with admin panel, hosting and support." };

const plans = [
  {
    name: "Starter",
    price: "Rs 4,999",
    period: "/ month",
    setup: "Setup Rs 15,000",
    tagline: "For a single-location business getting online.",
    features: ["Any template from your category", "Free subdomain (yourname.siteforge.pk)", "Admin panel with 2 users", "Orders, bookings & leads", "English + Urdu", "1 GB media storage", "WhatsApp support"],
  },
  {
    name: "Business",
    price: "Rs 8,999",
    period: "/ month",
    setup: "Setup Rs 25,000",
    tagline: "Your own domain and room to grow.",
    featured: true,
    features: ["Everything in Starter", "Custom domain (yourshop.pk) connected", "5 admin users", "Email notifications", "5 GB media storage", "Template switch once a year", "Priority support"],
  },
  {
    name: "Chain",
    price: "Custom",
    period: "",
    setup: "Multiple branches / brands",
    tagline: "Several websites managed from one place.",
    features: ["Multiple domains & templates", "Unlimited users", "Custom sections & integrations", "Dedicated onboarding", "Data export on request"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Pricing</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">Simple monthly pricing</h1>
        <p className="mt-3 text-slate-600">Hosting, SSL, admin panel, updates and support are all included. No hidden charges. Prices are placeholders you can change from the super admin content later.</p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`relative rounded-3xl border p-8 ${p.featured ? "border-brand-500 bg-slate-950 text-white shadow-2xl" : "border-slate-200 bg-white"}`}>
            {p.featured ? <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">Most popular</span> : null}
            <h3 className="font-heading text-xl font-bold">{p.name}</h3>
            <p className={`mt-1 text-sm ${p.featured ? "text-slate-300" : "text-slate-500"}`}>{p.tagline}</p>
            <p className="mt-6 text-4xl font-extrabold">
              {p.price}
              <span className={`text-base font-medium ${p.featured ? "text-slate-300" : "text-slate-500"}`}>{p.period}</span>
            </p>
            <p className={`mt-1 text-sm ${p.featured ? "text-slate-300" : "text-slate-500"}`}>{p.setup}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <BadgeCheck className={`mt-0.5 size-4 shrink-0 ${p.featured ? "text-brand-400" : "text-emerald-600"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contact" className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-semibold ${p.featured ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
              Get started
            </Link>
          </div>
        ))}
      </div>
      <section className="mt-20 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Not sure which plan?</h2>
          <p className="mt-2 text-slate-600">Tell us about your business and we will recommend a template and plan on a quick call.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm compact />
        </div>
      </section>
    </div>
  );
}
