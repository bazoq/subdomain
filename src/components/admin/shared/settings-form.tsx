"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "@/components/admin/uploader";
import { saveSettings, type SettingsSection } from "@/server/settings/actions";
import { DEFAULT_HOURS, type TenantSettings } from "@/lib/tenant-settings";
import { cn, formatPkPhone, normalizePkPhone } from "@/lib/utils";
import { brand } from "@/config/brand";

type TabKey = SettingsSection;
type Errors = Record<string, string>;
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

/* ---------- client-side validation (mirrors what the server normalises/expects) ---------- */

const HEX = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_MSG = "Enter a valid Pakistani number, e.g. 0300 1234567 or 021 34567890";

function phoneError(v: string | undefined, required = false): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return required ? "Required" : undefined;
  return normalizePkPhone(s) ? undefined : PHONE_MSG;
}
function emailError(v: string | undefined): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  return EMAIL.test(s) ? undefined : "Enter a valid email address";
}
function urlError(v: string | undefined, opts: { allowPath?: boolean } = {}): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  if (/\s/.test(s)) return "Links cannot contain spaces";
  if (opts.allowPath && (s.startsWith("/") || s.startsWith("#"))) return undefined;
  if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(s)) return undefined;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return undefined; // bare domain, server adds https://
  return "Enter a full link starting with https://";
}
function intError(v: unknown, label = "Value"): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return `${label} must be a whole number`;
  if (n < 0) return `${label} cannot be negative`;
  return undefined;
}

export function validateSection(tab: TabKey, s: TenantSettings): Errors {
  const e: Errors = {};
  const set = (k: string, msg?: string) => {
    if (msg) e[k] = msg;
  };
  switch (tab) {
    case "branding":
      for (const k of ["primaryColor", "secondaryColor", "accentColor"] as const) {
        const v = (s.branding[k] ?? "").trim();
        if (v && !HEX.test(v)) set(k, "Use a 6-digit hex colour like #1A2B3C, or leave blank");
      }
      break;
    case "contact":
      set("phone", phoneError(s.contact.phone, true));
      set("phone2", phoneError(s.contact.phone2));
      set("whatsapp", phoneError(s.contact.whatsapp));
      set("email", emailError(s.contact.email));
      if (s.contact.mapEmbedUrl?.trim() && !/^https:\/\/www\.google\.com\/maps\/embed/i.test(s.contact.mapEmbedUrl.trim())) {
        set("mapEmbedUrl", "Paste the src link from Google Maps → Share → Embed a map (starts with https://www.google.com/maps/embed)");
      }
      break;
    case "social":
      for (const k of ["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter"] as const) set(k, urlError(s.social[k]));
      break;
    case "commerce":
      set("minOrder", intError(s.commerce.minOrder, "Minimum order"));
      set("defaultShippingFee", intError(s.commerce.defaultShippingFee, "Shipping fee"));
      set("freeShippingAbove", intError(s.commerce.freeShippingAbove, "Amount"));
      set("lowStockThreshold", intError(s.commerce.lowStockThreshold, "Threshold"));
      if (!/^[A-Z0-9]{1,6}$/.test(s.commerce.orderPrefix)) set("orderPrefix", "1–6 capital letters or digits");
      break;
    case "restaurant":
      set("minDeliveryOrder", intError(s.restaurant.minDeliveryOrder, "Minimum order"));
      set("defaultDeliveryFee", intError(s.restaurant.defaultDeliveryFee, "Delivery fee"));
      set("prepTimeMins", intError(s.restaurant.prepTimeMins, "Preparation time"));
      break;
    case "seo": {
      const ga = (s.seo.googleAnalyticsId ?? "").trim();
      if (ga && !/^(G|UA|AW|GT)-[A-Z0-9-]{4,}$/i.test(ga)) set("googleAnalyticsId", "Looks wrong — Google IDs start with G- (e.g. G-XXXXXXXXXX)");
      const px = (s.seo.facebookPixelId ?? "").trim();
      if (px && !/^\d{6,20}$/.test(px)) set("facebookPixelId", "A Pixel ID is a number of 6–20 digits");
      if ((s.seo.title ?? "").length > 70) set("title", "Keep the title under 70 characters");
      if ((s.seo.description ?? "").length > 170) set("description", "Keep the description under 170 characters");
      break;
    }
    case "notifications":
      set("emailTo", emailError(s.notifications.emailTo));
      set("whatsappTo", phoneError(s.notifications.whatsappTo));
      break;
    case "announcement":
      if (s.announcement.enabled && !s.announcement.text.trim()) set("text", "Enter the announcement text or turn the bar off");
      set("link", urlError(s.announcement.link, { allowPath: true }));
      break;
    case "hours":
      for (const h of s.hours) {
        if (!h.closed && (!/^\d{2}:\d{2}$/.test(h.open) || !/^\d{2}:\d{2}$/.test(h.close))) set(`hours.${h.day}`, "Enter both an opening and a closing time");
      }
      break;
    case "languages":
      break;
  }
  return e;
}

function focusFirstInvalid(root: HTMLElement | null) {
  const el = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.focus({ preventScroll: true });
}

/* ---------- form ---------- */

export function SettingsForm({ initial, modules, initialTab }: { initial: TenantSettings; modules: string[]; initialTab?: string }) {
  const tabs = ALL_TABS.filter((t) => (t.key === "commerce" ? modules.includes("ecommerce") : t.key === "restaurant" ? modules.includes("restaurant") : true));
  const [tab, setTabState] = React.useState<TabKey>(tabs.some((t) => t.key === initialTab) ? (initialTab as TabKey) : "branding");
  const [s, setS] = React.useState<TenantSettings>(initial);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [dirty, setDirty] = React.useState<Set<TabKey>>(new Set());
  const [status, setStatus] = React.useState("");
  const toast = useToast();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const tabRefs = React.useRef(new Map<TabKey, HTMLButtonElement>());
  const baseId = React.useId();
  const tabId = (k: TabKey) => `${baseId}-tab-${k}`;
  const panelId = (k: TabKey) => `${baseId}-panel-${k}`;

  // warn before closing the tab / reloading with unsaved changes in any section
  React.useEffect(() => {
    if (dirty.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function setTab(next: TabKey, focus = false) {
    setTabState(next);
    setErrors({});
    // keep the URL shareable / reload-safe without a server round trip
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("tab", next);
      window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* ignore */
    }
    if (focus) requestAnimationFrame(() => tabRefs.current.get(next)?.focus());
  }

  function onTabKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const keys = tabs.map((t) => t.key);
    let j: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % keys.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + keys.length) % keys.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = keys.length - 1;
    if (j === null) return;
    e.preventDefault();
    setTab(keys[j], true);
  }

  function patch<K extends TabKey>(key: K, value: Partial<TenantSettings[K]> | TenantSettings[K]) {
    setS((prev) => ({ ...prev, [key]: Array.isArray(value) ? value : { ...(prev[key] as object), ...(value as object) } }));
    setDirty((d) => new Set(d).add(key));
  }
  /** clear one field's error as soon as the user edits it */
  function clearError(k: string) {
    if (errors[k]) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)));
  }

  async function save() {
    const clientErrors = validateSection(tab, s);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      const n = Object.keys(clientErrors).length;
      setStatus(`${n} field${n === 1 ? "" : "s"} need attention.`);
      toast.push("error", `Please fix ${n} field${n === 1 ? "" : "s"} before saving.`);
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    setSaving(true);
    let res: Awaited<ReturnType<typeof saveSettings>>;
    try {
      res = await saveSettings(tab, s[tab]);
    } catch (e) {
      res = { ok: false, message: (e as Error).message || "Could not save. Check your connection and try again." };
    }
    setSaving(false);
    if (res.ok) {
      toast.push("success", res.message ?? "Saved");
      setStatus(`${tabs.find((t) => t.key === tab)?.label ?? "Settings"} saved.`);
      setErrors({});
      // keep local edits of OTHER (unsaved) sections; take the server copy for the saved one
      if (res.data?.settings) {
        const saved = res.data.settings;
        setS((prev) => ({ ...prev, [tab]: saved[tab] }));
      }
      setDirty((d) => {
        const n = new Set(d);
        n.delete(tab);
        return n;
      });
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      setStatus(res.message);
      toast.push("error", res.message);
      if (res.fieldErrors && Object.keys(res.fieldErrors).length) requestAnimationFrame(() => focusFirstInvalid(formRef.current));
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
  const current = tabs.find((t) => t.key === tab);
  const errorCount = Object.keys(errors).length;
  const dirtyLabels = tabs.filter((t) => dirty.has(t.key)).map((t) => t.label);

  /** normalise a valid PK number to the friendly local form on blur */
  const phoneBlur = (v: string | undefined, apply: (formatted: string) => void) => {
    const t = (v ?? "").trim();
    if (t && normalizePkPhone(t)) apply(formatPkPhone(t));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div role="tablist" aria-label="Settings sections" aria-orientation="horizontal" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
        {tabs.map((t, i) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                if (el) tabRefs.current.set(t.key, el);
                else tabRefs.current.delete(t.key);
              }}
              type="button"
              role="tab"
              id={tabId(t.key)}
              aria-selected={selected}
              aria-controls={panelId(t.key)}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={(ev) => onTabKey(ev, i)}
              className={cn(
                "flex min-h-10 shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
                selected ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {t.label}
              {dirty.has(t.key) ? (
                <span className={cn("size-2 shrink-0 rounded-full", selected ? "bg-amber-300" : "bg-amber-400")} aria-hidden="true" />
              ) : null}
              {dirty.has(t.key) ? <span className="sr-only"> (unsaved changes)</span> : null}
            </button>
          );
        })}
      </div>

      <form
        ref={formRef}
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault();
          void save();
        }}
        className="space-y-5"
      >
        <div role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)} tabIndex={0} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-5">
          <h2 className="sr-only">{current?.label}</h2>
          {tab === "branding" ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Logo" help="PNG or SVG with transparent background works best.">
                  <ImageField label="Logo" value={b.logoUrl ?? ""} onChange={(url) => patch("branding", { logoUrl: url })} folder="branding" aspect="aspect-[3/1]" />
                </Field>
                <Field label="Favicon" help="Square image, at least 64×64.">
                  <ImageField label="Favicon" value={b.faviconUrl ?? ""} onChange={(url) => patch("branding", { faviconUrl: url })} folder="branding" aspect="aspect-square" className="max-w-[140px]" />
                </Field>
              </div>
              <p className="text-sm text-slate-500">Colours override the template palette. Leave blank to use the template default.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["primaryColor", "secondaryColor", "accentColor"] as const).map((k) => {
                  const id = `${baseId}-${k}`;
                  const label = k.replace("Color", " colour").replace(/^\w/, (x) => x.toUpperCase());
                  return (
                    <Field key={k} label={label} error={e(k)} htmlFor={id} help="Hex code, e.g. #1A2B3C">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={HEX.test(b[k] ?? "") ? (b[k] as string) : "#000000"}
                          onChange={(ev) => {
                            clearError(k);
                            patch("branding", { [k]: ev.target.value });
                          }}
                          className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                          aria-label={`${label} picker`}
                        />
                        <Input
                          id={id}
                          value={b[k] ?? ""}
                          placeholder="#RRGGBB"
                          spellCheck={false}
                          autoCapitalize="none"
                          aria-invalid={e(k) ? true : undefined}
                          aria-describedby={e(k) ? `${id}-error` : `${id}-help`}
                          onChange={(ev) => {
                            clearError(k);
                            patch("branding", { [k]: ev.target.value });
                          }}
                        />
                      </div>
                    </Field>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 pt-5">
                <Switch
                  checked={b.hidePoweredBy ?? false}
                  onChange={(v) => patch("branding", { hidePoweredBy: v })}
                  label={`Hide the “Powered by ${brand.name}” credit in the footer`}
                  description="White-label your site. When off, a small credit line links back to the platform."
                />
              </div>
            </div>
          ) : null}

          {tab === "contact" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" error={e("phone")} required help="Shown on your website and used for the call button.">
                <Input
                  value={c.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  onChange={(ev) => {
                    clearError("phone");
                    patch("contact", { phone: ev.target.value });
                  }}
                  onBlur={() => phoneBlur(c.phone, (p) => patch("contact", { phone: p }))}
                />
              </Field>
              <Field label="Second phone" error={e("phone2")}>
                <Input
                  value={c.phone2 ?? ""}
                  type="tel"
                  inputMode="tel"
                  placeholder="021 34567890"
                  onChange={(ev) => {
                    clearError("phone2");
                    patch("contact", { phone2: ev.target.value });
                  }}
                  onBlur={() => phoneBlur(c.phone2, (p) => patch("contact", { phone2: p }))}
                />
              </Field>
              <Field label="WhatsApp number" error={e("whatsapp")} help="Used for the WhatsApp button and order links. Mobile numbers only.">
                <Input
                  value={c.whatsapp}
                  type="tel"
                  inputMode="tel"
                  placeholder="0300 1234567"
                  onChange={(ev) => {
                    clearError("whatsapp");
                    patch("contact", { whatsapp: ev.target.value });
                  }}
                  onBlur={() => phoneBlur(c.whatsapp, (p) => patch("contact", { whatsapp: p }))}
                />
              </Field>
              <Field label="Email" error={e("email")}>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={c.email}
                  onChange={(ev) => {
                    clearError("email");
                    patch("contact", { email: ev.target.value });
                  }}
                />
              </Field>
              <Field label="Address" error={e("address")} className="sm:col-span-2">
                <Input value={c.address} autoComplete="street-address" placeholder="Shop 12, Main Boulevard, Gulberg III" onChange={(ev) => patch("contact", { address: ev.target.value })} />
              </Field>
              <Field label="City" error={e("city")}>
                <Input value={c.city} autoComplete="address-level2" placeholder="Lahore" onChange={(ev) => patch("contact", { city: ev.target.value })} />
              </Field>
              <Field label="Google Maps embed URL" error={e("mapEmbedUrl")} className="sm:col-span-2" help='Google Maps → Share → Embed a map → copy the src="…" link (https://www.google.com/maps/embed?…).'>
                <Input
                  value={c.mapEmbedUrl ?? ""}
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="https://www.google.com/maps/embed?pb=…"
                  onChange={(ev) => {
                    clearError("mapEmbedUrl");
                    // accept a pasted <iframe …> and pull out its src
                    const m = ev.target.value.match(/src="([^"]+)"/);
                    patch("contact", { mapEmbedUrl: m ? m[1] : ev.target.value });
                  }}
                />
              </Field>
            </div>
          ) : null}

          {tab === "social" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["facebook", "instagram", "tiktok", "youtube", "linkedin", "twitter"] as const).map((k) => (
                <Field key={k} label={k === "twitter" ? "X (Twitter)" : k.charAt(0).toUpperCase() + k.slice(1)} error={e(k)}>
                  <Input
                    value={so[k] ?? ""}
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={`https://${k === "twitter" ? "x" : k}.com/yourpage`}
                    onChange={(ev) => {
                      clearError(k);
                      patch("social", { [k]: ev.target.value });
                    }}
                  />
                </Field>
              ))}
            </div>
          ) : null}

          {tab === "languages" ? (
            <div className="space-y-5">
              <Switch checked={l.urduEnabled} onChange={(v) => patch("languages", { urduEnabled: v })} label="Enable Urdu (اردو) version of the website" description="Every text field in the admin gets an Urdu input and visitors get a language switch. Missing Urdu text falls back to English." />
              <Field label="Default language" help={l.urduEnabled ? "The language visitors see first." : "Enable Urdu above to change this."}>
                <Select value={l.defaultLang} onChange={(ev) => patch("languages", { defaultLang: ev.target.value as "en" | "ur" })} disabled={!l.urduEnabled}>
                  <option value="en">English</option>
                  <option value="ur">اردو (Urdu)</option>
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
                <Input type="number" inputMode="numeric" min={0} step={1} value={cm.minOrder} onChange={(ev) => patch("commerce", { minOrder: Number(ev.target.value) })} />
              </Field>
              <Field label="Default shipping fee (Rs)" error={e("defaultShippingFee")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={cm.defaultShippingFee} onChange={(ev) => patch("commerce", { defaultShippingFee: Number(ev.target.value) })} />
              </Field>
              <Field label="Free shipping above (Rs)" error={e("freeShippingAbove")} help="Blank = never free">
                <Input type="number" inputMode="numeric" min={0} step={1} value={cm.freeShippingAbove ?? ""} onChange={(ev) => patch("commerce", { freeShippingAbove: ev.target.value === "" ? undefined : Number(ev.target.value) })} />
              </Field>
              <Field label="Order number prefix" error={e("orderPrefix")} help="1–6 capital letters or digits, e.g. ORD">
                <Input
                  maxLength={6}
                  value={cm.orderPrefix}
                  autoCapitalize="characters"
                  spellCheck={false}
                  onChange={(ev) => {
                    clearError("orderPrefix");
                    patch("commerce", { orderPrefix: ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") });
                  }}
                />
              </Field>
              <Field label="Low stock alert threshold" error={e("lowStockThreshold")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={cm.lowStockThreshold} onChange={(ev) => patch("commerce", { lowStockThreshold: Number(ev.target.value) })} />
              </Field>
            </div>
          ) : null}

          {tab === "restaurant" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <Switch checked={r.acceptingOrders} onChange={(v) => patch("restaurant", { acceptingOrders: v })} label="Accepting online orders" description={r.acceptingOrders ? undefined : "Visitors see a “not accepting orders right now” notice."} />
                <Switch checked={r.delivery} onChange={(v) => patch("restaurant", { delivery: v })} label="Delivery" />
                <Switch checked={r.pickup} onChange={(v) => patch("restaurant", { pickup: v })} label="Pickup" />
                <Switch checked={r.dineIn} onChange={(v) => patch("restaurant", { dineIn: v })} label="Dine-in" />
                <Switch checked={r.reservations} onChange={(v) => patch("restaurant", { reservations: v })} label="Table reservations" />
                <Switch checked={r.soundAlerts} onChange={(v) => patch("restaurant", { soundAlerts: v })} label="Sound alert for new orders (kitchen screen)" />
              </div>
              <Field label="Minimum delivery order (Rs)" error={e("minDeliveryOrder")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={r.minDeliveryOrder} onChange={(ev) => patch("restaurant", { minDeliveryOrder: Number(ev.target.value) })} />
              </Field>
              <Field label="Default delivery fee (Rs)" error={e("defaultDeliveryFee")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={r.defaultDeliveryFee} onChange={(ev) => patch("restaurant", { defaultDeliveryFee: Number(ev.target.value) })} />
              </Field>
              <Field label="Preparation time (minutes)" error={e("prepTimeMins")}>
                <Input type="number" inputMode="numeric" min={0} step={1} value={r.prepTimeMins} onChange={(ev) => patch("restaurant", { prepTimeMins: Number(ev.target.value) })} />
              </Field>
            </div>
          ) : null}

          {tab === "hours" ? (
            <div>
              <p className="mb-4 text-sm text-slate-500">Shown in the footer, contact page and “Open now” badge (Pakistan time).</p>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200" role="group" aria-label="Opening hours by day">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = hours.find((x) => x.day === d) ?? { day: d, open: "10:00", close: "22:00", closed: false };
                  const set = (p: Partial<typeof h>) => patch("hours", hours.map((x) => (x.day === d ? { ...h, ...p } : x)).concat(hours.some((x) => x.day === d) ? [] : [{ ...h, ...p }]));
                  const err = e(`hours.${d}`);
                  return (
                    <div key={d} className="px-3 py-2 text-sm">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[110px_1fr_1fr_auto]">
                        <span className="font-medium text-slate-800">{DAYS[d]}</span>
                        <div className="order-last col-span-2 grid grid-cols-2 gap-3 sm:order-none sm:col-span-2 sm:contents">
                          <Input type="time" value={h.open} disabled={h.closed} onChange={(ev) => set({ open: ev.target.value })} aria-label={`${DAYS[d]} opens`} aria-invalid={err ? true : undefined} />
                          <Input type="time" value={h.close} disabled={h.closed} onChange={(ev) => set({ close: ev.target.value })} aria-label={`${DAYS[d]} closes`} aria-invalid={err ? true : undefined} />
                        </div>
                        <Switch checked={h.closed} onChange={(v) => set({ closed: v })} label="Closed" />
                      </div>
                      <FieldError>{err}</FieldError>
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
              <Field label="Site title" error={e("title")} help={`${(seo.title ?? "").length}/70 · Appears in the browser tab and Google results after each page title.`}>
                <Input
                  maxLength={70}
                  value={seo.title ?? ""}
                  onChange={(ev) => {
                    clearError("title");
                    patch("seo", { title: ev.target.value });
                  }}
                />
              </Field>
              <Field label="Site description" error={e("description")} help={`${(seo.description ?? "").length}/170 · Shown under your site name in search results.`}>
                <Textarea
                  maxLength={170}
                  className="min-h-[80px]"
                  value={seo.description ?? ""}
                  onChange={(ev) => {
                    clearError("description");
                    patch("seo", { description: ev.target.value });
                  }}
                />
              </Field>
              <Field label="Social share image (Open Graph)" help="1200×630 recommended.">
                <ImageField label="Social share image" value={seo.ogImageUrl ?? ""} onChange={(url) => patch("seo", { ogImageUrl: url })} folder="branding" aspect="aspect-[1.91/1]" className="max-w-md" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Google Analytics ID" error={e("googleAnalyticsId")}>
                  <Input
                    placeholder="G-XXXXXXXXXX"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={seo.googleAnalyticsId ?? ""}
                    onChange={(ev) => {
                      clearError("googleAnalyticsId");
                      patch("seo", { googleAnalyticsId: ev.target.value.trim() });
                    }}
                  />
                </Field>
                <Field label="Facebook Pixel ID" error={e("facebookPixelId")}>
                  <Input
                    inputMode="numeric"
                    value={seo.facebookPixelId ?? ""}
                    onChange={(ev) => {
                      clearError("facebookPixelId");
                      patch("seo", { facebookPixelId: ev.target.value.trim() });
                    }}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email new orders & messages to" error={e("emailTo")} help="Defaults to your contact email.">
                <Input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  value={n.emailTo ?? ""}
                  onChange={(ev) => {
                    clearError("emailTo");
                    patch("notifications", { emailTo: ev.target.value });
                  }}
                />
              </Field>
              <Field label="WhatsApp alerts to" error={e("whatsappTo")} help="Number that receives order links.">
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="0300 1234567"
                  value={n.whatsappTo ?? ""}
                  onChange={(ev) => {
                    clearError("whatsappTo");
                    patch("notifications", { whatsappTo: ev.target.value });
                  }}
                  onBlur={() => phoneBlur(n.whatsappTo, (p) => patch("notifications", { whatsappTo: p }))}
                />
              </Field>
            </div>
          ) : null}

          {tab === "announcement" ? (
            <div className="space-y-4">
              <Switch checked={a.enabled} onChange={(v) => patch("announcement", { enabled: v })} label="Show announcement bar at the top of the website" />
              <div className={cn("grid gap-3", l.urduEnabled && "md:grid-cols-2")}>
                <Field label="Text" error={e("text")} required={a.enabled}>
                  <Input
                    value={a.text}
                    maxLength={160}
                    placeholder="Eid sale: flat 20% off till Sunday!"
                    onChange={(ev) => {
                      clearError("text");
                      patch("announcement", { text: ev.target.value });
                    }}
                  />
                </Field>
                {l.urduEnabled ? (
                  <div dir="rtl">
                    <Field label="Text (اردو)" error={e("textUr")}>
                      <Input lang="ur" dir="rtl" className="font-urdu" maxLength={160} value={a.textUr ?? ""} onChange={(ev) => patch("announcement", { textUr: ev.target.value })} />
                    </Field>
                  </div>
                ) : null}
              </div>
              <Field label="Link (optional)" error={e("link")} help="e.g. /shop or https://…">
                <Input
                  value={a.link ?? ""}
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={(ev) => {
                    clearError("link");
                    patch("announcement", { link: ev.target.value });
                  }}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <span className="min-w-0 text-xs" role="status" aria-live="polite">
            <span className="sr-only">{status}</span>
            {errorCount ? (
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertCircle className="size-3.5" aria-hidden="true" /> {errorCount} field{errorCount === 1 ? "" : "s"} need attention
              </span>
            ) : dirtyLabels.length ? (
              <span className="text-amber-600">Unsaved changes: {dirtyLabels.join(", ")}</span>
            ) : (
              <span className="text-slate-400">Each section saves separately.</span>
            )}
          </span>
          <Button type="submit" loading={saving} disabled={!dirty.has(tab) && errorCount === 0}>
            Save {current?.label.toLowerCase()}
          </Button>
        </div>
      </form>
    </div>
  );
}
