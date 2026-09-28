import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { brand, pricing } from "@/config/brand";
import { getCategory } from "@/lib/categories";
import { LeadForm } from "@/components/super-site/lead-form";
import { Container, Glow, GridTexture, Panel, SectionHeading } from "@/components/super-site/ui";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/components/super-site/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact us — get your website",
  description: `Call, WhatsApp (${brand.supportPhone}) or send the form and ${brand.name} will set up your business website on your own domain.`,
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ category?: string; plan?: string }> }) {
  const { category, plan } = await searchParams;
  const safeCategory = category && getCategory(category) ? category : undefined;
  const chosenPlan = pricing.plans.find((p) => p.key === plan);
  const channels = [
    { icon: MessageCircle, label: "WhatsApp", value: brand.supportPhone, href: `https://wa.me/${brand.whatsapp}`, external: true, tone: "text-emerald-400" },
    { icon: Phone, label: "Call", value: brand.supportPhone, href: `tel:${brand.supportPhone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: brand.supportEmail, href: `mailto:${brand.supportEmail}` },
    { icon: MapPin, label: "Office", value: brand.address },
  ];
  return (
    <div className="relative isolate">
      <GridTexture />
      <Glow className="left-[-10rem] top-[-10rem] h-[32rem] w-[48rem]" />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Container className="grid gap-14 pb-24 pt-14 sm:pt-20 lg:grid-cols-2">
        <div>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title={
              <>
                Let&apos;s get your website <em className="text-gold-gradient">live</em>
              </>
            }
            lead="Send your details and we will call or WhatsApp you to pick a template, connect your domain and hand over your admin login."
          />
          <p className="mt-5 font-urdu text-xl leading-10 text-zinc-300" dir="rtl" lang="ur">
            اپنی تفصیلات بھیجیں، ہم آپ کو کال یا واٹس ایپ کریں گے۔
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {channels.map((ch) => {
              const inner = (
                <>
                  <ch.icon className={`size-5 ${ch.tone ?? "text-gold-400"}`} aria-hidden />
                  <span className="mt-3 block text-xs uppercase tracking-[0.18em] text-zinc-500">{ch.label}</span>
                  <span className="mt-1 block truncate text-sm font-medium text-zinc-100">{ch.value}</span>
                </>
              );
              return (
                <Panel as="li" key={ch.label} className="rounded-2xl">
                  {ch.href ? (
                    <a href={ch.href} {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block rounded-2xl p-5 transition hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
                      {inner}
                    </a>
                  ) : (
                    <div className="p-5">{inner}</div>
                  )}
                </Panel>
              );
            })}
          </ul>
          <p className="mt-8 text-sm text-zinc-500">We reply within hours, 7 days a week. Your number is used only to contact you about your website.</p>
        </div>
        <Panel className="self-start p-6 sm:p-10">
          <h2 className="font-display text-3xl text-white">Request your website</h2>
          <p className="mt-2 text-sm text-zinc-500">Takes 30 seconds. No payment needed.</p>
          <LeadForm className="mt-8" defaultCategory={safeCategory} source={chosenPlan ? `contact:${chosenPlan.key}` : "contact"} defaultMessage={chosenPlan ? `I am interested in the ${chosenPlan.name} plan.` : undefined} />
        </Panel>
      </Container>
    </div>
  );
}
