import type { Metadata } from "next";
import { ArrowRight, Banknote, Cloud, Languages, Lock, Server, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { ButtonLink, Container, Glow, GridTexture, Panel, SectionHeading } from "@/components/super-site/ui";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/components/super-site/seo";

export const metadata: Metadata = pageMetadata({
  title: `About ${brand.name}`,
  description: `${brand.name} builds and manages complete websites for Pakistani businesses: ${TOTAL_TEMPLATES} industry templates, cash on delivery, WhatsApp and Urdu built in, hosted and maintained for you.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="relative isolate">
      <GridTexture />
      <Glow className="left-1/2 top-[-16rem] h-[32rem] w-[60rem] -translate-x-1/2" />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Container className="pb-24 pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          eyebrow={`About ${brand.name}`}
          title={
            <>
              Websites that work the way <em className="text-gold-gradient">Pakistan</em> does
            </>
          }
          lead={`Most website builders are made for card payments, English-only audiences and owners who enjoy fiddling with layouts. ${brand.name} is different: ${TOTAL_TEMPLATES} templates designed around ${CATEGORIES.length} real business types, cash on delivery, WhatsApp and Urdu built in, and a managed setup so you never touch DNS or hosting.`}
        />
        <p className="mt-6 max-w-2xl font-urdu text-xl leading-10 text-zinc-300" dir="rtl" lang="ur">
          {brand.taglineUr}
        </p>

        <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
          {[
            [String(TOTAL_TEMPLATES), "templates"],
            [String(CATEGORIES.length), "industries"],
            ["1 day", "to go live"],
            ["EN + اردو", "on every site"],
          ].map(([v, l]) => (
            <div key={l} className="bg-ink-900 p-6 text-center sm:p-8">
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="font-display block text-4xl text-white sm:text-5xl">{v}</span>
                <span className="mt-1 block text-sm text-zinc-500">{l}</span>
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Banknote, t: "Local by default", d: "COD checkout, PKR pricing, Pakistani cities and phone formats, Umrah packages, marla and kanal, Eid sales." },
            { icon: Languages, t: "English and Urdu", d: "A single toggle turns on Urdu with proper right-to-left layout and Nastaliq type." },
            { icon: ShieldCheck, t: "Isolated and secure", d: "Every website's data, media and users are separated. Private files such as CVs and prescriptions are never public." },
            { icon: Cloud, t: "Modern infrastructure", d: "Hosted on a global edge network with automatic SSL, a managed Postgres database and object storage." },
            { icon: Server, t: "One platform, many sites", d: "Each domain or subdomain is its own website with its own template and admin panel, managed centrally." },
            { icon: Lock, t: "Owner control", d: "You get an admin login for your domain. Change anything, any time, or ask us to do it." },
          ].map((f) => (
            <Panel as="li" key={f.t} className="p-7">
              <f.icon className="size-6 text-gold-400" aria-hidden />
              <h2 className="font-display mt-5 text-2xl text-white">{f.t}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{f.d}</p>
            </Panel>
          ))}
        </ul>

        <Panel as="section" className="relative mt-20 overflow-hidden p-10 text-center sm:p-16" aria-labelledby="about-cta">
          <Glow className="left-1/2 top-[-8rem] h-[20rem] w-[40rem] -translate-x-1/2" />
          <h2 id="about-cta" className="font-display text-4xl text-white sm:text-5xl">
            Ready to see your business online?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-400">Browse the designs for your industry or send us a message — we will do the rest.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/templates">
              Browse templates <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              Contact us
            </ButtonLink>
          </div>
        </Panel>
      </Container>
    </div>
  );
}
