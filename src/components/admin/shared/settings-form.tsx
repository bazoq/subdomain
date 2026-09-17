"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "@/components/admin/uploader";
import { saveSettings, type SettingsSection } from "@/server/settings/actions";
import { DEFAULT_HOURS, type TenantSettings } from "@/lib/tenant-settings";
import { cn } from "@/lib/utils";

type TabKey = SettingsSection;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "branding", label: "Branding" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Social" },
  { key: "languages", label: "Languages" },
  { key: "commerce", label: "Store" },
  { key: "restaurant", label: "Restaurant" },
  { key: "hours", label: "Opening hours" },
  { key: "seo", label: "SEO" },
  { key: "notifications", label: "Notifications" },
  { key: "announcement", label: "Announcement" },
];

export function SettingsForm({ initial, modules, initialTab }: { initial: TenantSettings; modules: string[]; initialTab?: string }) {
  const tabs = ALL_TABS.filter((t) => (t.key === "commerce" ? modules.includes("ecommerce") : t.key === "restaurant" ? modules.includes("restaurant") : true));
  const [tab, setTab] = React.useState<TabKey>(tabs.some((t) => t.key === initialTab) ? (initialTab as TabKey) : "branding");
  const [s, setS] = React.useState<TenantSettings>(initial);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [dirty, setDirty] = React.useState<Set<TabKey>>(new Set());
  const toast = useToast();
  const router = useRouter();

  function patch<K extends TabKey>(key: K, value: Partial<TenantSettings[K]> | TenantSettings[K]) {
    setS((prev) => ({ ...prev, [key]: Array.isArray(value) ? value : { ...(prev[key] as object), ...(value as object) } }));
    setDirty((d) => new Set(d).add(key));
  }

  async function save() {
    setSaving(true);
    const res = await saveSettings(tab, s[tab]);
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setErrors({});
      if (res.data?.settings) setS(res.data.settings);
      setDirty((d) => {
        const n = new Set(d);
        n.delete(tab);
        return n;
      });
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.push("error", res.message);
    }
  }

  const e = (k: string) => errors[k];
  const b = s.branding;
  const c = s.contact;
  const so = s.social;
  const l = s.languages;
  const cm = s.commerce;
  const r = s.restaurant;
  const seo = s.seo;
  const n = s.notifications;
  const a = s.announcement;
  const hours = s.hours.length ? [...s.hours].sort((x, y) => x.day - y.day) : DEFAULT_HOURS;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setErrors({});
            }}
            className={cn("flex shrink-0 items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium", tab === t.key ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100")}
          >
            {t.label}
            {dirty.has(t.key) ? <span className="ms-2 size-1.5 rounded-full bg-amber-400" aria-label="Unsaved" /> : null}
          </button>
        ))}
      </nav>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {tab === "branding" ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Logo" help="PNG or SVG with transparent background works best.">
                  <ImageField value={b.logoUrl ?? ""} onChange={(url) => patch("branding", { logoUrl: url })} folder="branding" aspect="aspect-[3/1]" />
                </Field>
                <Field label="Favicon" help="Square image, at least 64×64.">
                  <ImageField value={b.faviconUrl ?? ""} onChange={(url) => patch("branding", { faviconUrl: url })} folder="branding" aspect="aspect-square" className="max-w-[140px]" />
                </Field>
              </div>
              <p className="text-sm text-slate-500">Colours override the template palette. Leave blank to use the template default.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["primaryColor", "secondaryColor", "accentColor"] as const).map((k) => (
                  <Field key={k} label={k.replace("Color", " colour").replace(/^\w/, (x) => x.toUpperCase())} error={e(k)}>
                    <div className="flex items-center gap-2">
                      <input type="color" value={b[k] || "#000000"} onChange={(ev) => patch("branding", { [k]: ev.target.value })} className="h-10 w-12 cursor-pointer rounded border border-slate-300" aria-label={k} />
                      <Input value={b[k] ?? ""} placeholder="#RRGGBB" onChange={(ev) => patch("branding", { [k]: ev.target.value })} />
                    </div>
                  </Field>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "contact" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" error={e("phone")} required>
                <Input value={c.phone} inputMode="tel" placeholder="0300-1234567" onChange={(ev) => patch("contact", { phone: ev.target.value })} />
              </Field>
              <Field label="Second phone" error={e("phone2")}>
                <Input value={c.phone2 ?? ""} inputMode="tel" onChange={(ev) => patch("contact", { phone2: ev.target.value })} />
              </Field>
              <Field label="WhatsApp number" error={e("whatsapp")} help="Used for the WhatsApp button and order links.">
                <Input value={c.whatsapp} inputMode="tel" placeholder="0300-1234567" onChange={(ev) => patch("contact", { whatsapp: ev.target.value })} />
              </Field>
              <Field label="Email" error={e("email")}>
                <Input type="email" value={c.email} onChange={(ev) => patch("contact", { email: ev.target.value })} />
              </Field>
              <Field label="Address" error={e("address")} className="sm:col-span-2">
                <Input value={c.address} placeholder="Shop 12, Main Boulevard, Gulberg III" onChange={(ev) => patch("contact", { address: ev.target.value })} />
              </Field>
              <Field label="City" error={e("city")}>
                <Input value={c.city} placeholder="Lahore" onChange={(ev) => patch("contact", { city: ev.target.value })} />
              </Field>
              <Field label="Google Maps embed URL" error={e("mapEmbedUrl")} className="sm:col-span-2" help='Google Maps → Share → Embed a map → copy the src="…" link (https://www.google.com/maps/embed?…).'>
                <Input value={c.mapEmbedUrl ?? ""} placeholder="https://www.google.com/maps/embed?pb=…" onChange={(ev) => patch("contact", { mapEmbedUrl: ev.target.value })} />
              </Field>
            </div>
          ) : null}

          {tab === "social" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter"] as const).map((k) => (
                <Field key={k} label={k === "twitter" ? "X (Twitter)" : k.charAt(0).toUpperCase() + k.slice(1)} error={e(k)}>
                  <Input value={so[k] ?? ""} placeholder={`https://${k === "twitter" ? "x" : k}.com/yourpage`} onChange={(ev) => patch("social", { [k]: ev.target.value })} />
                </Field>
              ))}
            </div>
          ) : null}

          {tab === "languages" ? (
            <div className="space-y-5">
              <Switch checked={l.urduEnabled} onChange={(v) => patch("languages", { urduEnabled: v })} label="Enable Urdu (اردو) version of the website" />
              <p className="text-sm text-slate-500">When enabled, every text field in the admin shows an Urdu input and visitors get a language switch. Missing Urdu text falls back to English.</p>
              <Field label="Default language">
                <Select value={l.defaultLang} onChange={(ev) => patch("languages", { defaultLang: ev.target.value as "en" | "ur" })} disabled={!l.urduEnabled}>
                  <option value="en">English</option>
                  <option value="ur">اردو</option>
                </Select>
              </Field>
            </div>
          ) : null}

          {tab === "commerce" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <Switch checked={cm.codEnabled} onChange={(v) => patch("commerce", { codEnabled: v })} label="Cash on delivery enabled" />
                <Switch checked={cm.whatsappOrders} onChange={(v) => patch("commerce", { whatsappOrders: v })} label="Show “Order on WhatsApp” button" />
                <Switch checked={cm.ageConfirmation} onChange={(v) => patch("commerce", { ageConfirmation: v })} label="Require 18+ age confirmation at checkout" />
              </div>
              <Field label="Minimum order (Rs)" error={e("minOrder")}>
                <Input type="number" min={0} value={cm.minOrder} onChange={(ev) => patch("commerce", { minOrder: Number(ev.target.value) })} />
              </Field>
              <Field label="Default shipping fee (Rs)" error={e("defaultShippingFee")}>
                <Input type="number" min={0} value={cm.defaultShippingFee} onChange={(ev) => patch("commerce", { defaultShippingFee: Number(ev.target.value) })} />
              </Field>
              <Field label="Free shipping above (Rs)" error={e("freeShippingAbove")} help="Blank = never free">
                <Input type="number" min={0} value={cm.freeShippingAbove ?? ""} onChange={(ev) => patch("commerce", { freeShippingAbove: ev.target.value === "" ? undefined : Number(ev.target.value) })} />
              </Field>
              <Field label="Order number prefix" error={e("orderPrefix")}>
                <Input maxLength={6} value={cm.orderPrefix} onChange={(ev) => patch("commerce", { orderPrefix: ev.target.value.toUpperCase() })} />
              </Field>
              <Field label="Low stock alert threshold" error={e("lowStockThreshold")}>
                <Input type="number" min={0} value={cm.lowStockThreshold} onChange={(ev) => patch("commerce", { lowStockThreshold: Number(ev.target.value) })} />
              </Field>
            </div>
          ) : null}

          {tab === "restaurant" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <Switch checked={r.acceptingOrders} onChange={(v) => patch("restaurant", { acceptingOrders: v })} label="Accepting online orders" />
                <Switch checked={r.delivery} onChange={(v) => patch("restaurant", { delivery: v })} label="Delivery" />
                <Switch checked={r.pickup} onChange={(v) => patch("restaurant", { pickup: v })} label="Pickup" />
                <Switch checked={r.dineIn} onChange={(v) => patch("restaurant", { dineIn: v })} label="Dine-in" />
                <Switch checked={r.reservations} onChange={(v) => patch("restaurant", { reservations: v })} label="Table reservations" />
                <Switch checked={r.soundAlerts} onChange={(v) => patch("restaurant", { soundAlerts: v })} label="Sound alert for new orders (kitchen screen)" />
              </div>
              <Field label="Minimum delivery order (Rs)" error={e("minDeliveryOrder")}>
                <Input type="number" min={0} value={r.minDeliveryOrder} onChange={(ev) => patch("restaurant", { minDeliveryOrder: Number(ev.target.value) })} />
              </Field>
              <Field label="Default delivery fee (Rs)" error={e("defaultDeliveryFee")}>
                <Input type="number" min={0} value={r.defaultDeliveryFee} onChange={(ev) => patch("restaurant", { defaultDeliveryFee: Number(ev.target.value) })} />
              </Field>
              <Field label="Preparation time (minutes)" error={e("prepTimeMins")}>
                <Input type="number" min={0} value={r.prepTimeMins} onChange={(ev) => patch("restaurant", { prepTimeMins: Number(ev.target.value) })} />
              </Field>
            </div>
          ) : null}

          {tab === "hours" ? (
            <div>
              <p className="mb-4 text-sm text-slate-500">Shown in the footer, contact page and “Open now” badge (Pakistan time).</p>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = hours.find((x) => x.day === d) ?? { day: d, open: "10:00", close: "22:00", closed: false };
                  const set = (p: Partial<typeof h>) => patch("hours", hours.map((x) => (x.day === d ? { ...h, ...p } : x)).concat(hours.some((x) => x.day === d) ? [] : [{ ...h, ...p }]));
                  return (
                    <div key={d} className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-3 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-800">{DAYS[d]}</span>
                      <Input type="time" value={h.open} disabled={h.closed} onChange={(ev) => set({ open: ev.target.value })} aria-label={`${DAYS[d]} opens`} />
                      <Input type="time" value={h.close} disabled={h.closed} onChange={(ev) => set({ close: ev.target.value })} aria-label={`${DAYS[d]} closes`} />
                      <Switch checked={h.closed} onChange={(v) => set({ closed: v })} label="Closed" />
                    </div>
                  );
                })}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => patch("hours", [1, 2, 3, 4, 5, 6, 0].map((d) => ({ ...(hours.find((x) => x.day === 1) ?? DEFAULT_HOURS[1]), day: d })))}>
                Copy Monday to all days
              </Button>
            </div>
          ) : null}

          {tab === "seo" ? (
            <div className="grid gap-4">
              <Field label="Site title" error={e("title")} help="Appears in the browser tab and Google results after each page title.">
                <Input maxLength={70} value={seo.title ?? ""} onChange={(ev) => patch("seo", { title: ev.target.value })} />
              </Field>
              <Field label="Site description" error={e("description")}>
                <Textarea maxLength={170} className="min-h-[80px]" value={seo.description ?? ""} onChange={(ev) => patch("seo", { description: ev.target.value })} />
              </Field>
              <Field label="Social share image (Open Graph)" help="1200×630 recommended.">
                <ImageField value={seo.ogImageUrl ?? ""} onChange={(url) => patch("seo", { ogImageUrl: url })} folder="branding" aspect="aspect-[1.91/1]" className="max-w-md" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Google Analytics ID" error={e("googleAnalyticsId")}>
                  <Input placeholder="G-XXXXXXXXXX" value={seo.googleAnalyticsId ?? ""} onChange={(ev) => patch("seo", { googleAnalyticsId: ev.target.value })} />
                </Field>
                <Field label="Facebook Pixel ID" error={e("facebookPixelId")}>
                  <Input value={seo.facebookPixelId ?? ""} onChange={(ev) => patch("seo", { facebookPixelId: ev.target.value })} />
                </Field>
              </div>
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email new orders & messages to" error={e("emailTo")} help="Defaults to your contact email.">
                <Input type="email" value={n.emailTo ?? ""} onChange={(ev) => patch("notifications", { emailTo: ev.target.value })} />
              </Field>
              <Field label="WhatsApp alerts to" error={e("whatsappTo")} help="Number that receives order links.">
                <Input inputMode="tel" value={n.whatsappTo ?? ""} onChange={(ev) => patch("notifications", { whatsappTo: ev.target.value })} />
              </Field>
            </div>
          ) : null}

          {tab === "announcement" ? (
            <div className="space-y-4">
              <Switch checked={a.enabled} onChange={(v) => patch("announcement", { enabled: v })} label="Show announcement bar at the top of the website" />
              <Field label="Text" error={e("text")}>
                <Input value={a.text} placeholder="Eid sale: flat 20% off till Sunday!" onChange={(ev) => patch("announcement", { text: ev.target.value })} />
              </Field>
              {l.urduEnabled ? (
                <div dir="rtl">
                  <Field label="Text (اردو)" error={e("textUr")}>
                    <Input className="font-urdu" value={a.textUr ?? ""} onChange={(ev) => patch("announcement", { textUr: ev.target.value })} />
                  </Field>
                </div>
              ) : null}
              <Field label="Link (optional)" error={e("link")} help="e.g. /shop or https://…">
                <Input value={a.link ?? ""} onChange={(ev) => patch("announcement", { link: ev.target.value })} />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          {dirty.has(tab) ? <span className="text-xs text-amber-600">Unsaved changes</span> : null}
          <Button type="submit" loading={saving}>
            Save {tabs.find((t) => t.key === tab)?.label.toLowerCase()}
          </Button>
        </div>
      </form>
    </div>
  );
}
