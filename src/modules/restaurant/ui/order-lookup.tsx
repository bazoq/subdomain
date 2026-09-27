"use client";

/**
 * Shown on /menu/order/[n] when the visitor has no valid tracking token: order number + the full phone number used
 * for the order → `lookupFoodOrder` → navigate to the tokenised, bookmarkable URL.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { lookupFoodOrder } from "../actions";
import { rs } from "../strings";
import type { RestaurantCtx } from "../types";

export function OrderLookup({ ctx, initialNumber, className }: { ctx: RestaurantCtx; initialNumber?: number; className?: string }) {
  const lang = ctx.lang;
  const router = useRouter();
  const [number, setNumber] = React.useState(initialNumber ? String(initialNumber) : "");
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const res = await lookupFoodOrder(number, phone).catch(() => null);
    if (res && res.ok && res.data) {
      router.replace(`/menu/order/${res.data.number}?t=${encodeURIComponent(res.data.token)}`);
      return; // stay busy until the verified page renders
    }
    setBusy(false);
    if (!res) setError(t(ui.somethingWrong, lang));
    else if (!res.ok) {
      setError(res.message || t(ui.somethingWrong, lang));
      setFieldErrors(res.fieldErrors ?? {});
    }
  }

  const err = (k: string) => (fieldErrors[k] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[k]}</p> : null);

  return (
    <form onSubmit={submit} className={cn("t-card mx-auto max-w-md p-6", className)} dir={ctx.dir} noValidate>
      <h1 className="font-heading text-2xl font-bold">{t(rs.trackTitle, lang)}</h1>
      <p className="mt-2 text-sm text-t-muted-fg">{t(rs.verifyPhone, lang)}</p>
      {error ? (
        <p role="alert" className="mt-3 rounded-[var(--t-radius)] bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="fo-number" className="mb-1 block text-sm font-medium">
            {t(ui.orderNumber, lang)}
          </label>
          <input id="fo-number" required inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} className="t-input" placeholder="#1024" />
          {err("number")}
        </div>
        <div>
          <label htmlFor="fo-phone" className="mb-1 block text-sm font-medium">
            {t(ui.phone, lang)}
          </label>
          <input id="fo-phone" required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="t-input" placeholder="03XX-XXXXXXX" />
          {err("phone")}
        </div>
      </div>
      <button type="submit" disabled={busy} className="t-btn t-btn-primary mt-5 w-full disabled:opacity-60">
        <Search className="size-4" />
        {busy ? t(ui.loading, lang) : t(rs.verify, lang)}
      </button>
    </form>
  );
}
