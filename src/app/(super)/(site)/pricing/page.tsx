import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { brand, pricing } from "@/config/brand";
import { ROOT_DOMAIN } from "@/config/site";
import { cn, formatPKR } from "@/lib/utils";
import { LeadForm } from "@/components/super-site/lead-form";
import { Container, Eyebrow, Glow, GridTexture, Panel, SectionHeading } from "@/components/super-site/ui";
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

const subdomainRoot = ROOT_DOMAIN === "localhost" ? "baxoq.com" : ROOT_DOMAIN;

export default function PricingPage() {
  return (
    <div className="relative isolate">
      <GridTexture />
      <Glow className="left-1/2 top-[-16rem] h-[34rem] w-[64rem] -translate-x-1/2" />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqJsonLd(FAQ),
        ]}
      />
      <Container className="pb-24 pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          align="center"
          eyebrow="Pricing"
          title={
            <>
              Simple, <em className="text-gold-gradient">honest</em> pricing
            </>
          }
          lead="Hosting, SSL, admin panel, updates and support are all included. No hidden charges, no per-order fees. All prices in Pakistani rupees."
        />

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {pricing.plans.map((p) => {
            const featured = Boolean(p.featured);
            return (
              <section
                key={p.key}
                aria-labelledby={`plan-${p.key}`}
                className={cn(
                  "ring-hairline relative flex flex-col rounded-3xl p-8",
                  featured ? "bg-gradient-to-b from-gold-400/[0.14] via-ink-850 to-ink-850 shadow-[0_40px_120px_-40px_rgba(226,187,114,0.45)] lg:-my-4 lg:py-12" : "bg-ink-850/80",
                )}
              >
                {featured ? <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-3 py-1 text-xs font-semibold text-ink-950">Most popular</span> : null}
                <h2 id={`plan-${p.key}`} className="font-display text-3xl text-white">
                  {p.name}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">{p.tagline}</p>
                <p className="font-display mt-8 text-6xl text-white">
                  {p.monthly != null ? (
                    <>
                      {formatPKR(p.monthly)}
                      <span className="font-sans text-base text-zinc-500"> / month</span>
                    </>
                  ) : (
                    "Custom"
                  )}
                </p>
                <p className="mt-2 text-sm text-zinc-500">{p.setup != null ? `One-time setup ${formatPKR(p.setup)}` : "Quoted per project · multiple branches or brands"}</p>
                <ul className="mb-10 mt-8 space-y-3 text-sm text-zinc-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                      {f === "Free subdomain on our platform" ? `Free subdomain (yourname.${subdomainRoot})` : f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/contact?plan=${p.key}`}
                  className={cn(
                    "mt-auto block rounded-full px-5 py-3 text-center text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
                    featured ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 hover:from-gold-200 hover:to-gold-400" : "border border-white/15 text-zinc-100 hover:bg-white/[0.06]",
                  )}
                >
                  {p.monthly != null ? "Get started" : "Talk to us"}
                  <span className="sr-only"> with the {p.name} plan</span>
                </Link>
              </section>
            );
          })}
        </div>

        <section className="mx-auto mt-28 max-w-3xl" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-display text-center text-4xl text-white sm:text-5xl">
            Questions, answered
          </h2>
          <div className="mt-10 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-zinc-100 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-gold-400 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-7 text-zinc-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <Panel as="section" className="mt-24 grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2" aria-labelledby="unsure-title">
          <div>
            <Eyebrow>Need advice?</Eyebrow>
            <h2 id="unsure-title" className="font-display mt-4 text-4xl text-white sm:text-5xl">
              Not sure which plan?
            </h2>
            <p className="mt-4 text-zinc-400">Tell us about your business and we will recommend a template and plan on a quick call or WhatsApp ({brand.supportPhone}).</p>
          </div>
          <LeadForm compact source="pricing" />
        </Panel>
      </Container>
    </div>
  );
}
