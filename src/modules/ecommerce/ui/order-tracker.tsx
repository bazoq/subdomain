"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getOrderStatus } from "../actions";
import type { OrderDTO, StoreCtx } from "../types";
import { OrderSummary } from "./order-summary";
import { sui } from "./strings";

/**
 * Order number + full phone lookup. On success the summary is shown immediately and the URL is replaced with the
 * tokenised, bookmarkable `/order/[n]?t=…` link (the server re-renders it as a verified page).
 */
export function OrderTracker({ ctx, initialNumber = "", title, className }: { ctx: StoreCtx; initialNumber?: string; title?: string; className?: string }) {
  const lang = ctx.lang;
  const router = useRouter();
  const [number, setNumber] = React.useState(initialNumber);
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [order, setOrder] = React.useState<OrderDTO | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const res = await getOrderStatus(number, phone);
    setBusy(false);
    if (res.ok && res.data) {
      const { token, ...dto } = res.data;
      setOrder(dto);
      if (token) router.replace(`/order/${dto.number}?t=${encodeURIComponent(token)}`);
    } else {
      setOrder(null);
      if (!res.ok) {
        setError(res.message || t(sui.orderNotFound, lang));
        setFieldErrors(res.fieldErrors ?? {});
      } else setError(t(sui.orderNotFound, lang));
    }
  }

  if (order) {
    return (
      <div className={className}>
        <OrderSummary order={order} ctx={ctx} prefix={ctx.commerce.orderPrefix} />
        <button type="button" onClick={() => setOrder(null)} className="mt-4 text-sm text-t-muted-fg underline underline-offset-2 hover:text-t-fg">
          {t(sui.trackTitle, lang)}
        </button>
      </div>
    );
  }

  const err = (k: string) => (fieldErrors[k] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} className={cn("t-card mx-auto max-w-md p-5 sm:p-6", className)} noValidate>
      <h2 className="font-heading text-xl font-semibold">{title ?? t(sui.trackTitle, lang)}</h2>
      <p className="mt-1 text-sm text-t-muted-fg">{t(sui.trackHelp, lang)}</p>
      {error ? (
        <p role="alert" className="mt-3 rounded-[var(--t-radius)] bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="track-number" className="mb-1 block text-sm font-medium">
            {t(ui.orderNumber, lang)}
          </label>
          <input id="track-number" required inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`${ctx.commerce.orderPrefix}-1024`} className="t-input" />
          {err("number")}
        </div>
        <div>
          <label htmlFor="track-phone" className="mb-1 block text-sm font-medium">
            {t(ui.phone, lang)}
          </label>
          <input id="track-phone" required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="t-input" />
          {err("phone")}
        </div>
      </div>
      <button type="submit" disabled={busy} className="t-btn t-btn-primary mt-5 w-full disabled:opacity-60">
        <Search className="size-4" />
        {busy ? t(ui.loading, lang) : t(ui.trackOrder, lang)}
      </button>
    </form>
  );
}
