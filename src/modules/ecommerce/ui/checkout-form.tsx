"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, ShoppingBag, Tag, X } from "lucide-react";
import { FileField } from "@/components/admin/uploader";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { placeOrder, validateCoupon } from "../actions";
import { computeShipping, couponDiscount } from "../pricing";
import { PK_CITIES, cartKey, type ShippingZoneDTO, type StoreCtx } from "../types";
import { useCart } from "./cart-provider";
import { fmt, sui } from "./strings";

type AppliedCoupon = { code: string; type: string; value: number };
const OTHER = "__other";

/**
 * COD checkout: delivery details, city (from shipping zones), coupon, optional gift message,
 * age confirmation and prescription upload. Submits JSON to `placeOrder` and redirects to the order page.
 */
export function CheckoutForm({ ctx, zones, showGiftMessage = false, className }: { ctx: StoreCtx; zones: ShippingZoneDTO[]; showGiftMessage?: boolean; className?: string }) {
  const lang = ctx.lang;
  const router = useRouter();
  const cart = useCart();
  const commerce = ctx.commerce;

  const zoneCities = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const z of zones) for (const c of z.cities) {
      const k = c.trim().toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        out.push(c.trim());
      }
    }
    return out;
  }, [zones]);
  const useSelect = zoneCities.length > 0;

  const [form, setForm] = React.useState({ name: "", phone: "", email: "", address: "", citySel: "", cityOther: "", notes: "", giftMessage: "" });
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [rx, setRx] = React.useState<{ id: string; fileName: string }>({ id: "", fileName: "" });
  const [couponInput, setCouponInput] = React.useState("");
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [couponBusy, setCouponBusy] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const city = useSelect ? (form.citySel === OTHER ? form.cityOther : form.citySel) : form.cityOther;
  const subtotal = cart.subtotal;
  const quote = computeShipping({ zones, city, subtotal, commerce });
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + quote.fee;
  const belowMin = commerce.minOrder > 0 && subtotal < commerce.minOrder;
  const needsRx = cart.requiresPrescription;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    const res = await validateCoupon(code, subtotal);
    setCouponBusy(false);
    if (res.ok && res.data) {
      setCoupon({ code: res.data.code, type: res.data.type, value: res.data.value });
      setCouponMsg({ ok: true, text: res.message ?? t(sui.couponApplied, lang) });
    } else {
      setCoupon(null);
      setCouponMsg({ ok: false, text: res.ok ? t(ui.somethingWrong, lang) : res.message });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setErrors({});
    setMessage(null);
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setSubmitting(true);
    const res = await placeOrder({
      items: cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, qty: i.qty })),
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city,
      notes: form.notes,
      couponCode: coupon?.code ?? "",
      giftMessage: showGiftMessage ? form.giftMessage : "",
      ageConfirmed,
      prescriptionMediaId: rx.id,
      website: honeypot,
    });
    setSubmitting(false);
    if (res.ok && res.data) {
      cart.clear();
      router.push(`/order/${res.data.number}?p=${res.data.phoneLast4}&new=1`);
      return;
    }
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setMessage(res.message);
      if (res.fieldErrors?.couponCode) setCoupon(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!cart.hydrated) {
    return (
      <div className={cn("py-16 text-center text-t-muted-fg", className)} aria-busy="true">
        {t(ui.loading, lang)}
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div className={cn("t-card mx-auto max-w-md px-6 py-14 text-center", className)}>
        <ShoppingBag className="mx-auto mb-3 size-10 text-t-muted-fg" />
        <h2 className="font-heading text-xl font-semibold">{t(ui.emptyCart, lang)}</h2>
        <Link href="/shop" className="t-btn t-btn-primary mt-6">
          {t(ui.continueShopping, lang)}
        </Link>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null);
  const label = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className={cn("grid gap-8 lg:grid-cols-5", className)} noValidate>
      <div className="space-y-6 lg:col-span-3">
        {message ? (
          <div role="alert" className="rounded-[var(--t-radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}
        {!commerce.codEnabled ? (
          <div role="alert" className="rounded-[var(--t-radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Online ordering is currently paused. Please contact us on WhatsApp to place an order.
          </div>
        ) : null}

        <section className="t-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">{t(sui.deliveryDetails, lang)}</h2>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className={label}>
                {t(ui.name, lang)} *
              </label>
              <input id="co-name" required autoComplete="name" value={form.name} onChange={set("name")} className="t-input" />
              {err("name")}
            </div>
            <div>
              <label htmlFor="co-phone" className={label}>
                {t(ui.phone, lang)} *
              </label>
              <input id="co-phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" value={form.phone} onChange={set("phone")} className="t-input" />
              {err("phone")}
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="co-email" className={label}>
              {t(ui.email, lang)}
            </label>
            <input id="co-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className="t-input" />
            {err("email")}
          </div>
          <div className="mt-4">
            <label htmlFor="co-address" className={label}>
              {t(ui.address, lang)} *
            </label>
            <textarea id="co-address" required rows={3} autoComplete="street-address" placeholder="House / flat, street, area, nearest landmark" value={form.address} onChange={set("address")} className="t-input" />
            {err("address")}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-city" className={label}>
                {t(ui.city, lang)} *
              </label>
              {useSelect ? (
                <select id="co-city" required value={form.citySel} onChange={set("citySel")} className="t-input">
                  <option value="" disabled>
                    {t(sui.selectCity, lang)}
                  </option>
                  {zoneCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={OTHER}>{t(sui.otherCity, lang)}</option>
                </select>
              ) : (
                <>
                  <input id="co-city" required list="pk-cities" autoComplete="address-level2" placeholder={t(sui.enterCity, lang)} value={form.cityOther} onChange={set("cityOther")} className="t-input" />
                  <datalist id="pk-cities">
                    {PK_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              )}
              {err("city")}
            </div>
            {useSelect && form.citySel === OTHER ? (
              <div>
                <label htmlFor="co-city-other" className={label}>
                  {t(sui.enterCity, lang)} *
                </label>
                <input id="co-city-other" required list="pk-cities" value={form.cityOther} onChange={set("cityOther")} className="t-input" />
                <datalist id="pk-cities">
                  {PK_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            ) : null}
          </div>
          <div className="mt-4">
            <label htmlFor="co-notes" className={label}>
              {t(ui.notes, lang)}
            </label>
            <textarea id="co-notes" rows={2} value={form.notes} onChange={set("notes")} className="t-input" />
            {err("notes")}
          </div>
          {showGiftMessage ? (
            <div className="mt-4">
              <label htmlFor="co-gift" className={label}>
                {t(sui.giftMessage, lang)}
              </label>
              <textarea id="co-gift" rows={2} maxLength={300} value={form.giftMessage} onChange={set("giftMessage")} className="t-input" />
              <p className="mt-1 text-xs text-t-muted-fg">{t(sui.giftMessageHelp, lang)}</p>
              {err("giftMessage")}
            </div>
          ) : null}
        </section>

        {needsRx ? (
          <section className="t-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">{t(sui.prescriptionUpload, lang)} *</h2>
            <p className="mt-1 text-sm text-t-muted-fg">{t(sui.prescriptionHelp, lang)}</p>
            <div className="mt-3">
              <FileField value={rx.id} onChange={(id, fileName) => setRx({ id, fileName })} folder="prescriptions" accept=".pdf,.jpg,.jpeg,.png" label={t(sui.rxFile, lang)} />
              {rx.id ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="size-4" /> {rx.fileName}
                </p>
              ) : null}
              {err("prescriptionMediaId")}
            </div>
          </section>
        ) : null}

        {commerce.ageConfirmation ? (
          <section className="t-card p-5 sm:p-6">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5 size-4" required />
              <span>{t(sui.ageConfirm, lang)} *</span>
            </label>
            {err("ageConfirmed")}
          </section>
        ) : null}
      </div>

      <aside className="lg:col-span-2">
        <div className="t-card p-5 lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-semibold">{t(sui.orderSummary, lang)}</h2>
          <ul className="mt-4 divide-y divide-t-border text-sm">
            {cart.items.map((i) => (
              <li key={cartKey(i)} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="line-clamp-1 font-medium">{i.name}</span>
                  <span className="text-xs text-t-muted-fg">
                    {i.variantName ? `${i.variantName} · ` : ""}
                    {i.qty} × {formatPKR(i.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{formatPKR(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-2 inline-block text-xs text-t-muted-fg underline underline-offset-2 hover:text-t-fg">
            {t(sui.viewCart, lang)}
          </Link>

          <div className="mt-4">
            <label htmlFor="co-coupon" className={label}>
              {t(ui.couponCode, lang)}
            </label>
            {coupon ? (
              <div className="flex items-center justify-between rounded-[var(--t-radius)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Tag className="size-4" /> {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponMsg(null);
                    setCouponInput("");
                  }}
                  className="inline-flex items-center gap-1 text-xs hover:underline"
                >
                  <X className="size-3" /> {t(sui.removeCoupon, lang)}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input id="co-coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="t-input uppercase" placeholder="e.g. EID10" />
                <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()} className="t-btn t-btn-outline shrink-0 px-4 py-2 text-sm disabled:opacity-50">
                  {t(ui.applyCoupon, lang)}
                </button>
              </div>
            )}
            {couponMsg ? <p className={cn("mt-1 text-xs", couponMsg.ok ? "text-emerald-700" : "text-red-600")}>{couponMsg.text}</p> : null}
            {err("couponCode")}
          </div>

          <dl className="mt-5 space-y-2 border-t border-t-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">{t(ui.subtotal, lang)}</dt>
              <dd>{formatPKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">
                {t(ui.shipping, lang)}
                {quote.zone ? <span className="block text-xs">{quote.zone.name}</span> : null}
              </dt>
              <dd className={cn(quote.free && "font-semibold text-emerald-700")}>{quote.free ? t(sui.free, lang) : city ? formatPKR(quote.fee) : "—"}</dd>
            </div>
            {quote.etaDays ? (
              <div className="flex justify-between text-xs text-t-muted-fg">
                <dt>{t(sui.estimatedDelivery, lang)}</dt>
                <dd>
                  {quote.etaDays} {t(sui.days, lang)}
                </dd>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <dt>{t(ui.discount, lang)}</dt>
                <dd>-{formatPKR(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-t-border pt-3 text-base font-bold">
              <dt>{t(ui.total, lang)}</dt>
              <dd>{formatPKR(total)}</dd>
            </div>
          </dl>
          {commerce.freeShippingAbove && !quote.free ? <p className="mt-2 text-xs text-emerald-700">{fmt(t(sui.freeShippingHint, lang), { amount: formatPKR(commerce.freeShippingAbove) })}</p> : null}
          {belowMin ? <p className="mt-2 text-xs text-amber-700">{fmt(t(sui.minOrderNotice, lang), { amount: formatPKR(commerce.minOrder) })}</p> : null}

          <div className="mt-4 flex items-start gap-2 rounded-[var(--t-radius)] bg-t-muted px-3 py-2 text-xs text-t-muted-fg">
            <Banknote className="mt-0.5 size-4 shrink-0" />
            <span>{t(sui.codOnly, lang)}</span>
          </div>

          <button type="submit" disabled={submitting || belowMin || !commerce.codEnabled} className="t-btn t-btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? t(sui.placingOrder, lang) : `${t(ui.placeOrder, lang)} · ${formatPKR(total)}`}
          </button>
        </div>
      </aside>
    </form>
  );
}
