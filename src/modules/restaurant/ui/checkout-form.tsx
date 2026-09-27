"use client";

/**
 * Checkout: order type, delivery zone/address, contact, optional scheduling, totals → placeFoodOrder.
 * Must be rendered inside <OrderProvider>.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Bike, Clock, Store, UtensilsCrossed } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { placeFoodOrder } from "../actions";
import { rs } from "../strings";
import { orderTypeLabel, type DeliveryZoneDto, type OrderType, type RestaurantCtx } from "../types";
import { useOrder } from "./order-provider";

function localDateTimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Random per-checkout key so a double tap / retried request never creates a second order. */
function newIdempotencyKey(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`.slice(0, 32).padEnd(16, "0");
  }
}

export function CheckoutForm({
  ctx,
  zones,
  isOpen,
  className,
}: {
  ctx: RestaurantCtx;
  zones: DeliveryZoneDto[];
  /** result of isOpenNow(settings.hours) computed on the server; null when hours are not configured */
  isOpen: boolean | null;
  className?: string;
}) {
  const lang = ctx.lang;
  const router = useRouter();
  const order = useOrder();
  const rest = ctx.restaurant;

  const enabledTypes = React.useMemo(() => {
    const types: OrderType[] = [];
    if (rest.delivery && zones.length) types.push("DELIVERY");
    if (rest.pickup) types.push("PICKUP");
    if (rest.dineIn) types.push("DINE_IN");
    return types;
  }, [rest.delivery, rest.pickup, rest.dineIn, zones.length]);

  const type: OrderType = enabledTypes.includes(order.orderType) ? order.orderType : (enabledTypes[0] ?? "PICKUP");
  const zone = zones.find((z) => z.id === order.zoneId) ?? null;

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [table, setTable] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [schedule, setSchedule] = React.useState(isOpen === false);
  const [when, setWhen] = React.useState("");
  const [minWhen, setMinWhen] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const honeypot = React.useRef<HTMLInputElement>(null);
  // one key per mounted checkout; survives re-renders and failed attempts so a retry can never double-order
  const [idempotencyKey] = React.useState(newIdempotencyKey);

  const deliveryFee = type === "DELIVERY" ? (zone?.fee ?? 0) : 0;
  const minOrder = type === "DELIVERY" ? (zone && zone.minOrder > 0 ? zone.minOrder : rest.minDeliveryOrder) : 0;
  const total = order.subtotal + deliveryFee;
  const belowMin = type === "DELIVERY" && order.subtotal < minOrder;
  const eta = rest.prepTimeMins + (type === "DELIVERY" ? (zone?.etaMins ?? 0) : 0);
  const blocked = !rest.acceptingOrders || (isOpen === false && !schedule);

  const err = (k: string) => (fieldErrors[k] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[k]}</p> : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || blocked) return;
    setError(null);
    setFieldErrors({});
    if (belowMin) {
      setError(`${t(rs.minOrder, lang)}: ${formatPKR(minOrder)}`);
      return;
    }
    setPending(true);
    const res = await placeFoodOrder({
      type,
      name,
      phone,
      notes,
      address: type === "DELIVERY" ? address : undefined,
      zoneId: type === "DELIVERY" ? (zone?.id ?? "") : undefined,
      tableNumber: type === "DINE_IN" ? table : undefined,
      scheduledFor: schedule && when ? new Date(when).toISOString() : undefined,
      idempotencyKey,
      website: honeypot.current?.value ?? "",
      lines: order.lines.map((l) => ({ menuItemId: l.menuItemId, sizeName: l.sizeName, modifierIds: l.modifiers.map((m) => m.id), qty: l.qty, note: l.note })),
    }).catch(() => null);
    if (res && res.ok && res.data) {
      order.clear();
      // number 0 = the submission was treated as a bot; nothing to show, back to the menu
      if (res.data.number > 0 && res.data.token) router.push(`/menu/order/${res.data.number}?t=${encodeURIComponent(res.data.token)}`);
      else router.push("/menu");
      return; // keep the button disabled while the redirect happens
    }
    setPending(false);
    if (!res) setError(t(ui.somethingWrong, lang)); // network hiccup: the same idempotency key makes the retry safe
    else if (!res.ok) {
      setError(res.message || t(ui.somethingWrong, lang));
      setFieldErrors(res.fieldErrors ?? {});
    }
  }

  if (!order.hydrated) return <div className={cn("py-16 text-center text-t-muted-fg", className)}>{t(ui.loading, lang)}</div>;

  if (order.lines.length === 0) {
    return (
      <div className={cn("t-card px-6 py-14 text-center", className)}>
        <p className="text-lg font-semibold">{t(rs.emptyOrder, lang)}</p>
        <a href="/menu" className="t-btn t-btn-primary mt-4 inline-flex">
          {t(rs.browseMenu, lang)}
        </a>
      </div>
    );
  }

  const typeIcon: Record<OrderType, React.ReactNode> = {
    DELIVERY: <Bike className="size-5" />,
    PICKUP: <Store className="size-5" />,
    DINE_IN: <UtensilsCrossed className="size-5" />,
  };

  return (
    <form onSubmit={submit} className={cn("grid gap-8 lg:grid-cols-5", className)} dir={ctx.dir}>
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="space-y-6 lg:col-span-3">
        {!rest.acceptingOrders ? (
          <div className="rounded-[var(--t-radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {t(rs.pausedNotice, lang)}
            {ctx.phone ? (
              <a href={`tel:${ctx.phone}`} className="ms-2 font-semibold underline">
                {ctx.phone}
              </a>
            ) : null}
          </div>
        ) : isOpen === false ? (
          <div className="rounded-[var(--t-radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t(rs.closedNotice, lang)}</div>
        ) : null}

        {/* order type */}
        <section>
          <h2 className="font-heading mb-3 text-lg font-bold">{t(rs.orderType, lang)}</h2>
          <div className={cn("grid gap-2", enabledTypes.length === 3 ? "grid-cols-3" : enabledTypes.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
            {enabledTypes.map((ty) => (
              <button
                key={ty}
                type="button"
                onClick={() => order.setOrderType(ty)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--t-radius)] border px-3 py-3 text-sm font-medium transition",
                  type === ty ? "border-t-primary bg-t-primary/10 text-t-primary" : "border-t-border hover:border-t-primary/50",
                )}
              >
                {typeIcon[ty]}
                {orderTypeLabel(ty, lang)}
              </button>
            ))}
          </div>
        </section>

        {type === "DELIVERY" ? (
          <section className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t(rs.deliveryArea, lang)}</label>
              <select value={zone?.id ?? ""} onChange={(e) => order.setZoneId(e.target.value || null)} className="t-input" required>
                <option value="" disabled>
                  {t(rs.selectArea, lang)}
                </option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.fee ? formatPKR(z.fee) : lang === "ur" ? "مفت" : "Free"}
                    {z.etaMins ? ` · ${z.etaMins} ${t(rs.mins, lang)}` : ""}
                  </option>
                ))}
              </select>
              {err("zoneId")}
              {zone ? (
                <p className="mt-1 text-xs text-t-muted-fg">
                  {t(rs.minOrder, lang)}: {formatPKR(minOrder)}
                  {zone.etaMins ? ` · ${t(rs.eta, lang)}: ${eta} ${t(rs.mins, lang)}` : ""}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t(rs.deliveryAddress, lang)}</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="t-input" required placeholder={lang === "ur" ? "گھر / فلیٹ نمبر، گلی، بلاک، علاقہ" : "House / flat no., street, block, landmark"} />
              {err("address")}
            </div>
          </section>
        ) : null}

        {type === "DINE_IN" ? (
          <section>
            <label className="mb-1 block text-sm font-medium">{t(rs.tableNumber, lang)}</label>
            <input value={table} onChange={(e) => setTable(e.target.value)} className="t-input max-w-xs" required placeholder="e.g. 7" />
            {err("tableNumber")}
          </section>
        ) : null}

        {/* contact */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t(ui.name, lang)}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="t-input" required autoComplete="name" />
            {err("name")}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t(ui.phone, lang)}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="t-input" required inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" />
            {err("phone")}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">{t(ui.notes, lang)}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="t-input" />
          </div>
        </section>

        {/* schedule */}
        <section className="rounded-[var(--t-radius)] border border-t-border p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => {
                setSchedule(e.target.checked);
                if (e.target.checked) setMinWhen(localDateTimeValue(new Date(Date.now() + 20 * 60_000)));
              }}
              className="size-4 accent-[var(--t-primary)]"
            />
            <Clock className="size-4 text-t-muted-fg" />
            {t(rs.scheduleLater, lang)}
          </label>
          {schedule ? (
            <div className="mt-3">
              <label className="mb-1 block text-xs text-t-muted-fg">{t(rs.scheduleTime, lang)}</label>
              <input
                type="datetime-local"
                value={when}
                min={minWhen || undefined}
                onFocus={() => setMinWhen(localDateTimeValue(new Date(Date.now() + 20 * 60_000)))}
                onChange={(e) => setWhen(e.target.value)}
                className="t-input max-w-xs"
                required={schedule}
              />
              {err("scheduledFor")}
            </div>
          ) : null}
        </section>
      </div>

      {/* summary */}
      <aside className="lg:col-span-2">
        <div className="t-card sticky top-4 p-5">
          <h2 className="font-heading mb-3 text-lg font-bold">{t(rs.yourOrder, lang)}</h2>
          <ul className="divide-y divide-t-border text-sm">
            {order.lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-medium">{l.qty} × </span>
                  {l.name}
                  {l.sizeName ? <span className="text-t-muted-fg"> ({l.sizeName})</span> : null}
                  {l.modifiers.length ? <span className="block text-xs text-t-muted-fg">{l.modifiers.map((m) => m.name).join(", ")}</span> : null}
                </span>
                <span className="shrink-0 tabular-nums">{formatPKR(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-t-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">{t(ui.subtotal, lang)}</dt>
              <dd className="tabular-nums">{formatPKR(order.subtotal)}</dd>
            </div>
            {type === "DELIVERY" ? (
              <div className="flex justify-between">
                <dt className="text-t-muted-fg">{t(ui.deliveryFee, lang)}</dt>
                <dd className="tabular-nums">{zone ? formatPKR(deliveryFee) : "—"}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold">
              <dt>{t(ui.total, lang)}</dt>
              <dd className="tabular-nums">{formatPKR(total)}</dd>
            </div>
          </dl>
          {belowMin ? (
            <p className="mt-2 text-xs text-red-600">
              {t(rs.minOrder, lang)}: {formatPKR(minOrder)}
            </p>
          ) : null}
          <p className="mt-3 rounded-[var(--t-radius)] bg-t-muted px-3 py-2 text-xs text-t-muted-fg">
            <strong>{t(ui.cashOnDelivery, lang)}.</strong> {t(rs.codNotice, lang)}
          </p>
          {!schedule ? (
            <p className="mt-2 text-xs text-t-muted-fg">
              {t(rs.estimated, lang)}: ~{eta} {t(rs.mins, lang)}
            </p>
          ) : null}
          {error ? <div className="mt-3 rounded-[var(--t-radius)] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <button type="submit" disabled={pending || blocked || belowMin} className="t-btn t-btn-primary mt-4 h-12 w-full text-base disabled:opacity-60">
            {pending ? t(rs.placing, lang) : `${t(rs.placeOrder, lang)} · ${formatPKR(total)}`}
          </button>
          <a href="/menu" className="mt-2 block text-center text-xs underline-offset-2 hover:underline">
            {t(rs.addMore, lang)}
          </a>
        </div>
      </aside>
    </form>
  );
}
