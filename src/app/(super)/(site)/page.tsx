import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight, BadgeCheck, Banknote, Globe, Languages, MessageCircle, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { TEMPLATES } from "@/templates/registry";
import { TemplateCard } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Store;
  return <Cmp className={className} />;
}

export default function SuperHome() {
  const featured = TEMPLATES.filter((t) => ["pizza-01", "clothing-01", "recruiting-01", "travel-02", "medical-01", "law-01", "realestate-01", "gym-02"].includes(t.id)).slice(0, 8);
  const fallback = featured.length ? featured : TEMPLATES.slice(0, 8);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10rem] h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-200/60 via-violet-200/40 to-rose-100/40 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-brand-600" /> {TOTAL_TEMPLATES} ready templates · {CATEGORIES.length} business types
            </span>
            <h1 className="font-heading mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              A complete website for your business, <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">ready in a day</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Pick a template made for your industry. We connect it to your domain, hand you a simple admin panel, and you start taking orders, bookings and enquiries with cash on delivery and WhatsApp built in.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/templates" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800">
                Browse templates <ArrowRight className="size-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50">
                Talk to us
              </Link>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Banknote, t: "Cash on delivery", d: "Orders work the Pakistani way." },
              { icon: MessageCircle, t: "WhatsApp built in", d: "Every enquiry one tap away." },
              { icon: Languages, t: "English + Urdu", d: "Switch languages with a toggle." },
              { icon: ShieldCheck, t: "Your data, isolated", d: "Every website fully separated." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                <f.icon className="size-5 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">{f.t}</p>
                <p className="text-xs text-slate-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-slate-100 bg-slate-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Made for your industry</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Every business gets the features it actually needs</h2>
            <p className="mt-3 text-slate-600">Not a generic page builder. A pizza shop gets a live kitchen board; a pharmacy gets prescription upload; a recruiter gets a job board.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link key={c.key} href={`/templates/${c.key}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white">
                    <CatIcon name={c.icon} className="size-5" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{c.templateCount} templates</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TEMPLATES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Templates</p>
              <h2 className="font-heading mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Unique designs, not clones</h2>
              <p className="mt-2 max-w-xl text-slate-600">Each template has its own typography, palette and layout, and every one comes with a live demo you can click through, including its admin panel.</p>
            </div>
            <Link href="/templates" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              See all {TOTAL_TEMPLATES} <ArrowRight className="size-4" />
            </Link>
          </div>
          {fallback.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {fallback.map((t) => (
                <TemplateCard key={t.id} meta={t} categoryName={CATEGORIES.find((c) => c.key === t.category)?.name} />
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Templates will appear here once generated.</p>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">How it works</p>
            <h2 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">Live in three steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", icon: Globe, t: "Choose a template & domain", d: "Pick the design you like. Use your own domain (yourshop.pk) or a free subdomain. We handle the technical setup." },
              { n: "02", icon: Smartphone, t: "Get your admin panel", d: "Log in at yourdomain.com/admin. Edit every text and image, add products or menu items, switch sections on or off." },
              { n: "03", icon: BadgeCheck, t: "Start selling", d: "Orders, bookings and enquiries land in your panel with WhatsApp and email alerts. Cash on delivery from day one." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <s.icon className="size-6 text-brand-400" />
                  <span className="font-heading text-3xl font-black text-white/20">{s.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADMIN PANEL PITCH */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Admin panel</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Simple enough for anyone on your team</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              {[
                "Edit any section's text and images, in English and Urdu",
                "Turn sections on or off, reorder them, reset to defaults",
                "Manage products, menus, jobs, packages or listings",
                "See orders live, update status, print invoices and kitchen tickets",
                "Leads inbox with WhatsApp and call buttons",
                "Add staff accounts with limited access",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-brand-50 p-3 shadow-xl">
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400">yourshop.pk/admin</span>
              </div>
              <div className="grid grid-cols-4 gap-0">
                <div className="col-span-1 space-y-2 border-r border-slate-100 p-3">
                  {["Dashboard", "Orders", "Products", "Sections", "Leads", "Settings"].map((n, i) => (
                    <div key={n} className={`rounded-md px-2 py-1.5 text-[11px] ${i === 1 ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-500"}`}>
                      {n}
                    </div>
                  ))}
                </div>
                <div className="col-span-3 space-y-3 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Pending", "12"],
                      ["Revenue", "Rs 184k"],
                      ["Low stock", "3"],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-lg border border-slate-100 p-2">
                        <p className="text-[10px] text-slate-400">{l}</p>
                        <p className="text-sm font-bold text-slate-900">{v}</p>
                      </div>
                    ))}
                  </div>
                  {["#ORD-1042 · Ayesha Khan · Rs 4,500", "#ORD-1041 · Bilal Ahmed · Rs 2,150", "#ORD-1040 · Sana Iqbal · Rs 7,900"].map((r) => (
                    <div key={r} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      {r}
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">PENDING</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + FORM */}
      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">Tell us about your business</h2>
            <p className="mt-4 text-slate-600">
              Share your name and number. We will call or WhatsApp you, help you choose a template, and set everything up. No technical knowledge needed.
            </p>
            <p className="mt-6 font-urdu text-lg leading-9 text-slate-700" dir="rtl">
              اپنا نام اور نمبر بھیجیں، ہم آپ سے رابطہ کریں گے اور آپ کے کاروبار کے لیے بہترین ٹیمپلیٹ منتخب کرنے میں مدد کریں گے۔
            </p>
            <p className="mt-6 text-sm text-slate-500">
              Or WhatsApp us directly: <a className="font-semibold text-slate-900" href={`https://wa.me/${brand.whatsapp}`}>{brand.supportPhone}</a>
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
