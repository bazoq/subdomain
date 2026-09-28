import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Banknote, Check, Globe, Languages, LayoutDashboard, MessageCircle, MousePointerClick, Rocket, ShieldCheck, Smartphone } from "lucide-react";
import { brand, entryPlan } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { formatPKR } from "@/lib/utils";
import { getFeaturedTemplates, getGalleryMetas } from "@/server/super/gallery";
import { BrowserFrame, PhoneFrame, TemplateCard, TemplateShot, demoHost, hasShot, templateHref, toCardData } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { ButtonLink, Container, Eyebrow, Glow, GridTexture, IconByName, Panel, SectionHeading } from "@/components/super-site/ui";
import { JsonLd, itemListJsonLd, pageMetadata, softwareApplicationJsonLd } from "@/components/super-site/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `${brand.name} — ${brand.tagline}`,
  absoluteTitle: true,
  description: brand.description,
  path: "/",
});

export default async function SuperHome() {
  const [featured, all] = await Promise.all([getFeaturedTemplates(8), getGalleryMetas()]);
  const offer = entryPlan();
  const catName = (key: string) => CATEGORIES.find((c) => c.key === key)?.name;

  // Showcase: three templates with real screenshots, from different industries where possible.
  const withShots = [...featured, ...all].filter((t, i, arr) => hasShot(t.id) && arr.findIndex((x) => x.id === t.id) === i);
  const showcase = withShots.filter((t, i, arr) => arr.findIndex((x) => x.category === t.category) === i).slice(0, 3);
  while (showcase.length < 3 && all[showcase.length]) showcase.push(all[showcase.length]);
  const [center, left, right] = showcase.map(toCardData);
  const phone = [...showcase].reverse().find((t) => hasShot(t.id, "mobile")) ?? showcase[0];

  return (
    <>
      <JsonLd
        data={[
          softwareApplicationJsonLd(offer),
          itemListJsonLd(
            "Business website templates by industry",
            CATEGORIES.map((c) => ({ name: `${c.name} website templates`, path: `/templates/${c.key}` })),
          ),
        ]}
      />

      {/* HERO */}
      <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
        <GridTexture />
        <Glow className="left-1/2 top-[-18rem] h-[40rem] w-[70rem] -translate-x-1/2" />
        <Glow tone="violet" className="right-[-10rem] top-[10rem] h-[30rem] w-[30rem]" />
        <Container className="pb-8 pt-16 sm:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur">
              <span className="size-1.5 rounded-full bg-gold-400 shadow-[0_0_10px_2px_rgba(226,187,114,0.6)]" aria-hidden />
              {TOTAL_TEMPLATES} templates · {CATEGORIES.length} industries · live in a day
            </p>
            <h1 id="hero-title" className="font-display mt-8 text-balance text-5xl leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Your business deserves a <em className="text-gold-gradient pr-1">beautiful</em> website.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              Choose a design made for your industry. We connect it to your domain, hand you a simple admin panel, and you start taking orders and enquiries — with cash on delivery, WhatsApp and Urdu built in.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/templates" className="w-full px-7 sm:w-auto">
                Browse {TOTAL_TEMPLATES} templates <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={`https://wa.me/${brand.whatsapp}`} external variant="ghost" className="w-full px-7 sm:w-auto">
                <MessageCircle className="size-4 text-emerald-400" aria-hidden /> Chat on WhatsApp
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-zinc-500">
              From <span className="font-semibold text-zinc-200">{formatPKR(offer.monthlyPrice)}</span> / month · hosting, SSL, admin panel and support included
            </p>
          </div>
        </Container>

        {/* Showcase: real demos, panning on their own */}
        {center ? (
          <Container className="relative pb-24 pt-10">
            <div className="relative mx-auto max-w-5xl [perspective:2000px]" aria-label="Examples of our templates" role="group">
              {left ? (
                <Link href={templateHref(left)} className="absolute left-0 top-10 hidden w-[42%] origin-right opacity-60 transition hover:opacity-100 lg:block [transform:rotateY(18deg)_translateX(-18%)]" tabIndex={-1} aria-hidden>
                  <BrowserFrame host={demoHost(left.id)}>
                    <TemplateShot meta={left} sizes="420px" autoplay />
                  </BrowserFrame>
                </Link>
              ) : null}
              {right ? (
                <Link href={templateHref(right)} className="absolute right-0 top-10 hidden w-[42%] origin-left opacity-60 transition hover:opacity-100 lg:block [transform:rotateY(-18deg)_translateX(18%)]" tabIndex={-1} aria-hidden>
                  <BrowserFrame host={demoHost(right.id)}>
                    <TemplateShot meta={right} sizes="420px" autoplay />
                  </BrowserFrame>
                </Link>
              ) : null}
              <Link href={templateHref(center)} className="relative z-10 mx-auto block w-full max-w-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400" aria-label={`${center.name} template, #${center.code}`}>
                <BrowserFrame host={demoHost(center.id)} className="shadow-[0_40px_120px_-30px_rgba(226,187,114,0.35)]">
                  <TemplateShot meta={center} sizes="(min-width: 1024px) 768px, 95vw" priority autoplay />
                </BrowserFrame>
              </Link>
              {phone ? (
                <div className="absolute -bottom-10 right-2 z-20 w-28 sm:right-8 sm:w-40 lg:right-[12%]" aria-hidden>
                  <PhoneFrame>
                    <TemplateShot meta={toCardData(phone)} device="mobile" sizes="160px" autoplay />
                  </PhoneFrame>
                </div>
              ) : null}
            </div>
          </Container>
        ) : null}
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-white/[0.06] bg-ink-900/60" aria-label="Built for Pakistan">
        <Container>
          <ul className="grid grid-cols-2 divide-white/[0.06] py-8 sm:grid-cols-4 sm:divide-x">
            {[
              { icon: Banknote, t: "Cash on delivery", d: "Orders the Pakistani way" },
              { icon: MessageCircle, t: "WhatsApp built in", d: "Every enquiry one tap away" },
              { icon: Languages, t: "English + اردو", d: "One toggle, proper RTL" },
              { icon: ShieldCheck, t: "Managed for you", d: "Hosting, SSL, backups" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 px-2 py-3 sm:justify-center sm:px-6">
                <f.icon className="size-5 shrink-0 text-gold-400" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{f.t}</p>
                  <p className="text-xs text-zinc-500">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 sm:py-32" aria-labelledby="categories-title">
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              id="categories-title"
              eyebrow="Start here"
              title={
                <>
                  What does your <em className="text-gold-gradient">business</em> do?
                </>
              }
              lead="Pick your industry to see designs made for it. A pizza shop gets a live kitchen board, a pharmacy gets prescription upload, a recruiter gets a job board."
            />
            <ButtonLink href="/templates" variant="ghost" className="self-start lg:self-auto">
              All {TOTAL_TEMPLATES} templates <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link
                  href={`/templates/${c.key}`}
                  className="group ring-hairline relative flex h-full items-center gap-4 overflow-hidden rounded-2xl bg-ink-850/70 p-4 transition hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:p-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gold-300 transition group-hover:border-gold-400/50 group-hover:bg-gold-400/10">
                    <IconByName name={c.icon} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-100 sm:text-base">{c.name}</span>
                    <span className="block text-xs text-zinc-500">{c.templateCount} designs</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-zinc-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FEATURED TEMPLATES */}
      <section className="relative isolate border-t border-white/[0.06] bg-ink-900/40 py-24 sm:py-32" aria-labelledby="featured-title">
        <Glow className="left-[-10rem] top-20 h-[30rem] w-[40rem]" />
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              id="featured-title"
              eyebrow="Featured designs"
              title={
                <>
                  Real websites, <em className="text-gold-gradient">not mock-ups</em>
                </>
              }
              lead="Every picture below is the live demo of that template. Hover to scroll through the page, or open the demo and click around — including its admin panel."
            />
            <ButtonLink href="/templates" variant="ghost" className="self-start lg:self-auto">
              Browse all <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          {featured.length ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((t) => (
                <TemplateCard key={t.id} meta={toCardData(t)} categoryName={catName(t.category)} />
              ))}
            </div>
          ) : (
            <p className="mt-14 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">Templates will appear here once published.</p>
          )}
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 sm:py-32" aria-labelledby="how-title">
        <Container>
          <SectionHeading
            id="how-title"
            align="center"
            eyebrow="How it works"
            title={
              <>
                Live in <em className="text-gold-gradient">three</em> simple steps
              </>
            }
            lead="No technical knowledge needed. We do the setup; you run your business."
          />
          <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
            <span className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" aria-hidden />
            {[
              { icon: MousePointerClick, t: "Pick a template", d: "Browse designs for your industry and open the live demo. Tell us the template number you like." },
              { icon: Globe, t: "We set it up", d: "We connect your domain (yourshop.pk) or a free subdomain, load your details and create your admin login." },
              { icon: Rocket, t: "Start selling", d: "Orders, bookings and enquiries arrive in your panel with WhatsApp alerts. Cash on delivery from day one." },
            ].map((s, i) => (
              <li key={s.t} className="relative text-center">
                <span className="relative mx-auto flex size-[4.5rem] items-center justify-center rounded-2xl border border-white/10 bg-ink-850 shadow-[0_0_40px_-10px_rgba(226,187,114,0.4)]">
                  <s.icon className="size-7 text-gold-300" aria-hidden />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950" aria-hidden>
                    {i + 1}
                  </span>
                </span>
                <h3 className="font-display mt-6 text-3xl text-white">{s.t}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-zinc-400">{s.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* EVERYTHING INCLUDED */}
      <section className="relative isolate border-t border-white/[0.06] bg-ink-900/40 py-24 sm:py-32" aria-labelledby="included-title">
        <Glow tone="violet" className="right-[-8rem] top-10 h-[28rem] w-[36rem]" />
        <Container>
          <SectionHeading
            id="included-title"
            eyebrow="Everything included"
            title={
              <>
                An admin panel <em className="text-gold-gradient">anyone</em> can use
              </>
            }
            lead="Your website comes with its own dashboard. Change text and pictures, add products, see orders the moment they arrive — from your phone."
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-5">
            <Panel className="overflow-hidden p-6 lg:col-span-3 lg:row-span-2 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <LayoutDashboard className="size-4 text-gold-400" aria-hidden /> Orders, live
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">New orders appear instantly with a sound. Confirm, print an invoice or a kitchen ticket, and message the customer on WhatsApp in one tap.</p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-ink-950/80 p-4" role="img" aria-label="Illustration of the admin panel: order counters and a list of pending orders">
                <div aria-hidden>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Pending", "12"],
                      ["Today", formatPKR(184_000, { compact: true })],
                      ["Low stock", "3"],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[11px] text-zinc-500">{l}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[
                      ["#1042", "Ayesha Khan", 4500, "New"],
                      ["#1041", "Bilal Ahmed", 2150, "Confirmed"],
                      ["#1040", "Sana Iqbal", 7900, "Shipped"],
                    ].map(([no, who, amt, st]) => (
                      <li key={String(no)} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-300">
                        <span>
                          <span className="font-mono text-zinc-500">{no}</span> · {who}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-zinc-400">{formatPKR(Number(amt))}</span>
                          <span className={st === "New" ? "rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-semibold text-gold-300" : "rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-zinc-400"}>{st}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
            {[
              { icon: Smartphone, t: "Edit from your phone", d: "Every section's text and images, in English and Urdu. Switch sections on or off." },
              { icon: MessageCircle, t: "Leads inbox", d: "Enquiries with call and WhatsApp buttons, so no customer slips through." },
              { icon: ShieldCheck, t: "Staff accounts", d: "Give your team their own logins with limited access." },
              { icon: Globe, t: "Your own domain", d: "yourshop.pk with free SSL, or a free subdomain to start." },
            ].map((f) => (
              <Panel key={f.t} className="p-6 lg:col-span-1">
                <f.icon className="size-5 text-gold-400" aria-hidden />
                <h3 className="mt-4 font-semibold text-zinc-100">{f.t}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{f.d}</p>
              </Panel>
            ))}
          </div>
        </Container>
      </section>

      {/* PRICE + CTA */}
      <section className="relative isolate overflow-hidden py-24 sm:py-32" aria-labelledby="cta-title">
        <Glow className="left-1/2 top-0 h-[36rem] w-[60rem] -translate-x-1/2" />
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Get started</Eyebrow>
            <h2 id="cta-title" className="font-display mt-4 text-balance text-4xl leading-[1.05] text-white sm:text-6xl">
              Tell us about your <em className="text-gold-gradient">business</em>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">Leave your name and number. We call or WhatsApp you, help you choose a template and set everything up.</p>
            <p className="mt-4 font-urdu text-lg leading-9 text-zinc-300" dir="rtl" lang="ur">
              اپنا نام اور نمبر بھیجیں، ہم آپ کے کاروبار کے لیے بہترین ٹیمپلیٹ منتخب کرنے میں مدد کریں گے۔
            </p>
            <Panel className="mt-10 p-6">
              <p className="text-sm text-zinc-400">Plans from</p>
              <p className="font-display mt-1 text-5xl text-white">
                {formatPKR(offer.monthlyPrice)}
                <span className="font-sans text-base text-zinc-500"> / month</span>
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                {["Hosting & SSL", "Admin panel", "Template updates", "WhatsApp support"].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="size-4 text-gold-400" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 hover:text-gold-200">
                Compare plans <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Panel>
          </div>
          <Panel className="p-6 sm:p-8">
            <LeadForm source="home" />
          </Panel>
        </Container>
      </section>
    </>
  );
}
