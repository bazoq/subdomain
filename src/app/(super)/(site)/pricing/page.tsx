import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { brand, pricing } from "@/config/brand";
import { ROOT_DOMAIN } from "@/config/site";
import { formatPKR } from "@/lib/utils";
import { LeadForm } from "@/components/super-site/lead-form";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/components/super-site/seo";

const cheapest = pricing.plans.find((p) => p.monthly != null);

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description: `Complete business website with admin panel, hosting, SSL and support from ${cheapest ? formatPKR(cheapest.monthly ?? 0) : "a simple monthly fee"} per month. No hidden charges, cancel any time.`,
  path: "/pricing",
});

const FAQ = [
  { q: "What is included in the monthly fee?", a: "Hosting, SSL certificate, the admin panel, all template updates, automatic backups and WhatsApp support. There are no per-order or per-visitor charges." },
  { q: "Is the setup fee one-time?", a: "Yes. The setup fee covers connecting your domain, creating your admin login, loading your initial content and a walkthrough call. You pay it once." },
  { q: "Can I pay in cash or by bank transfer?", a: "Yes. We accept bank transfer, JazzCash, EasyPaisa and cash at our Lahore office. Invoices are issued in PKR." },
  { q: "Can I change my template later?", a: "Business and Chain plans include a template switch once a year. Your content is kept where the sections match." },
  { q: "What happens if I stop paying?", a: "Your website is paused after a 14-day grace period and deleted 60 days later. You can export your data on request before then." },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqJsonLd(FAQ),
        ]}
      />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Pricing</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">Simple monthly pricing</h1>
        <p className="mt-3 text-slate-600">Hosting, SSL, admin panel, updates and support are all included. No hidden charges, no per-order fees. All prices in Pakistani rupees.</p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {pricing.plans.map((p) => {
          const featured = Boolean(p.featured);
          const sub = featured ? "text-slate-300" : "text-slate-500";
          return (
            <section key={p.key} aria-labelledby={`plan-${p.key}`} className={`relative rounded-3xl border p-8 ${featured ? "border-brand-500 bg-slate-950 text-white shadow-2xl" : "border-slate-200 bg-white"}`}>
              {featured ? <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">Most popular</span> : null}
              <h2 id={`plan-${p.key}`} className="font-heading text-xl font-bold">
                {p.name}
              </h2>
              <p className={`mt-1 text-sm ${sub}`}>{p.tagline}</p>
              <p className="mt-6 text-4xl font-extrabold">
                {p.monthly != null ? (
                  <>
                    {formatPKR(p.monthly)}
                    <span className={`text-base font-medium ${sub}`}> / month</span>
                  </>
                ) : (
                  "Custom"
                )}
              </p>
              <p className={`mt-1 text-sm ${sub}`}>{p.setup != null ? `One-time setup ${formatPKR(p.setup)}` : "Quoted per project · multiple branches or brands"}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <BadgeCheck className={`mt-0.5 size-4 shrink-0 ${featured ? "text-brand-400" : "text-emerald-600"}`} aria-hidden />
                    {f === "Free subdomain on our platform" ? `Free subdomain (yourname.${ROOT_DOMAIN === "localhost" ? "siteforge.pk" : ROOT_DOMAIN})` : f}
                  </li>
                ))}
              </ul>
              <Link href={`/contact?plan=${p.key}`} className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-semibold ${featured ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                {p.monthly != null ? "Get started" : "Talk to us"}
                <span className="sr-only"> with the {p.name} plan</span>
              </Link>
            </section>
          );
        })}
      </div>

      <section className="mt-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="font-heading text-2xl font-bold text-slate-900">
          Pricing questions
        </h2>
        <dl className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <dt className="font-semibold text-slate-900">{f.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 grid items-center gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2" aria-labelledby="unsure-title">
        <div>
          <h2 id="unsure-title" className="font-heading text-2xl font-bold text-slate-900">
            Not sure which plan?
          </h2>
          <p className="mt-2 text-slate-600">Tell us about your business and we will recommend a template and plan on a quick call or WhatsApp ({brand.supportPhone}).</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <LeadForm compact source="pricing" />
        </div>
      </section>
    </div>
  );
}
