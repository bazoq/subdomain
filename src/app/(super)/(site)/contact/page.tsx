import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { brand, pricing } from "@/config/brand";
import { getCategory } from "@/lib/categories";
import { LeadForm } from "@/components/super-site/lead-form";
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
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Contact</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">Let&apos;s get your website live</h1>
          <p className="mt-4 text-lg text-slate-600">Send your details and we will call or WhatsApp you to pick a template, connect your domain and hand over your admin login.</p>
          <p className="mt-4 font-urdu text-lg leading-9 text-slate-700" dir="rtl" lang="ur">
            اپنی تفصیلات بھیجیں، ہم آپ کو کال یا واٹس ایپ کریں گے۔
          </p>
          <ul className="mt-8 space-y-4 text-slate-700">
            <li className="flex items-center gap-3">
              <MessageCircle className="size-5 text-emerald-600" aria-hidden />
              <a href={`https://wa.me/${brand.whatsapp}`} className="font-medium hover:underline" target="_blank" rel="noopener noreferrer">
                WhatsApp {brand.supportPhone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-5 text-brand-600" aria-hidden />
              <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`} className="font-medium hover:underline">
                {brand.supportPhone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-5 text-brand-600" aria-hidden />
              <a href={`mailto:${brand.supportEmail}`} className="font-medium hover:underline">
                {brand.supportEmail}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-5 text-brand-600" aria-hidden />
              {brand.address}
            </li>
          </ul>
          <p className="mt-8 text-sm text-slate-500">We reply within hours, 7 days a week. Your number is used only to contact you about your website.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <LeadForm defaultCategory={safeCategory} source={chosenPlan ? `contact:${chosenPlan.key}` : "contact"} defaultMessage={chosenPlan ? `I am interested in the ${chosenPlan.name} plan.` : undefined} />
        </div>
      </div>
    </div>
  );
}
