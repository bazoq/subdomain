import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { brand } from "@/config/brand";
import { LeadForm } from "@/components/super-site/lead-form";

export const metadata: Metadata = { title: "Contact", description: `Get your business website from ${brand.name}. Call, WhatsApp or send the form.` };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Contact</p>
          <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">Let&apos;s get your website live</h1>
          <p className="mt-4 text-lg text-slate-600">Send your details and we will call or WhatsApp you to pick a template, connect your domain and hand over your admin login.</p>
          <p className="mt-4 font-urdu text-lg leading-9 text-slate-700" dir="rtl">
            اپنی تفصیلات بھیجیں، ہم آپ کو کال یا واٹس ایپ کریں گے۔
          </p>
          <ul className="mt-8 space-y-4 text-slate-700">
            <li className="flex items-center gap-3">
              <MessageCircle className="size-5 text-emerald-600" />
              <a href={`https://wa.me/${brand.whatsapp}`} className="font-medium hover:underline" target="_blank" rel="noreferrer">
                WhatsApp {brand.supportPhone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-5 text-brand-600" />
              <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`} className="font-medium hover:underline">
                {brand.supportPhone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-5 text-brand-600" />
              <a href={`mailto:${brand.supportEmail}`} className="font-medium hover:underline">
                {brand.supportEmail}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-5 text-brand-600" />
              {brand.address}
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <LeadForm defaultCategory={category} />
        </div>
      </div>
    </div>
  );
}
