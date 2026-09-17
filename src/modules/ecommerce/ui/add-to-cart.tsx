"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileHeart, MessageCircle, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR, whatsappLink } from "@/lib/utils";
import { availableStock, effectivePrice, maxQtyFor } from "../pricing";
import type { ProductDTO, StoreCtx, VariantDTO } from "../types";
import { useCart } from "./cart-provider";
import { PriceTag } from "./price-tag";
import { StockBadge } from "./stock-badge";
import { fmt, sui } from "./strings";

function optionNames(variants: VariantDTO[]): string[] {
  const names: string[] = [];
  for (const v of variants) for (const k of Object.keys(v.options)) if (!names.includes(k)) names.push(k);
  return names;
}

function valuesFor(variants: VariantDTO[], name: string): string[] {
  const vals: string[] = [];
  for (const v of variants) {
    const val = v.options[name];
    if (val && !vals.includes(val)) vals.push(val);
  }
  return vals;
}

/**
 * Variant pickers (built from the variants' `options` JSON), quantity stepper, Add to cart,
 * Buy now (→ /checkout) and an optional WhatsApp order button.
 */
export function AddToCart({ product, ctx, className }: { product: ProductDTO; ctx: StoreCtx; className?: string }) {
  const lang = ctx.lang;
  const router = useRouter();
  const cart = useCart();
  const variants = product.variants;
  const names = React.useMemo(() => optionNames(variants), [variants]);

  const [selected, setSelected] = React.useState<Record<string, string>>(() => {
    const first = variants.find((v) => availableStock(product, v) > 0) ?? variants[0];
    return first ? { ...first.options } : {};
  });
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const variant = React.useMemo(() => (names.length ? (variants.find((v) => names.every((n) => v.options[n] === selected[n])) ?? null) : null), [names, variants, selected]);
  const needsVariant = variants.length > 0;
  const price = effectivePrice(product, variant);
  const stock = needsVariant ? (variant ? availableStock(product, variant) : 0) : availableStock(product);
  const maxQty = maxQtyFor(product, variant);
  const canBuy = stock > 0 && (!needsVariant || !!variant);
  const safeQty = Math.min(qty, Math.max(1, maxQty));

  function isValueAvailable(name: string, value: string): boolean {
    return variants.some((v) => v.options[name] === value && names.every((n) => n === name || !selected[n] || v.options[n] === selected[n]) && availableStock(product, v) > 0);
  }

  function buildItem() {
    return {
      productId: product.id,
      variantId: variant?.id,
      slug: product.slug,
      name: t(product.name, lang),
      variantName: variant?.name,
      imageUrl: variant?.imageUrl || product.images[0],
      unitPrice: price,
      requiresPrescription: product.requiresPrescription,
      maxQty,
    };
  }

  function add() {
    if (!canBuy) return;
    cart.add(buildItem(), safeQty);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2500);
  }

  function buyNow() {
    if (!canBuy) return;
    cart.add(buildItem(), safeQty);
    router.push("/checkout");
  }

  const waNumber = ctx.contact.whatsapp || ctx.contact.phone;
  const waText = `Assalam o Alaikum ${ctx.tenantName}, I want to order:\n${safeQty} × ${t(product.name, "en")}${variant ? ` (${variant.name})` : ""} — ${formatPKR(price * safeQty)}\nhttps://${ctx.host}/shop/${product.slug}`;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <PriceTag price={price} comparePrice={variant?.price != null ? null : product.comparePrice} size="lg" />
        <StockBadge product={product} variant={needsVariant ? variant : undefined} ctx={ctx} lowThreshold={ctx.commerce.lowStockThreshold} />
      </div>

      {names.map((name) => (
        <fieldset key={name}>
          <legend className="mb-2 text-sm font-medium">
            {name}: <span className="text-t-muted-fg">{selected[name] ?? fmt(t(sui.selectOption, lang), { name })}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {valuesFor(variants, name).map((value) => {
              const active = selected[name] === value;
              const avail = isValueAvailable(name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected((s) => ({ ...s, [name]: value }))}
                  className={cn(
                    "min-w-11 rounded-[var(--t-radius)] border px-3 py-2 text-sm font-medium transition",
                    active ? "border-t-primary bg-t-primary text-t-primary-fg" : "border-t-border bg-t-card hover:border-t-primary",
                    !avail && "opacity-50 line-through",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {needsVariant && !variant ? <p className="text-sm text-red-600">{t(sui.unavailableCombo, lang)}</p> : null}

      {product.requiresPrescription ? (
        <div className="flex items-start gap-2 rounded-[var(--t-radius)] border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <FileHeart className="mt-0.5 size-4 shrink-0" />
          <span>{t(sui.prescriptionNote, lang)}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex h-12 items-center rounded-[var(--t-radius)] border border-t-border bg-t-card" role="group" aria-label={t(ui.quantity, lang)}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={safeQty <= 1} className="flex h-full w-11 items-center justify-center disabled:opacity-40" aria-label="Decrease quantity">
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQty}
            value={safeQty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
            aria-label={t(ui.quantity, lang)}
            className="h-full w-12 border-x border-t-border bg-transparent text-center text-sm font-semibold outline-none"
          />
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={safeQty >= maxQty} className="flex h-full w-11 items-center justify-center disabled:opacity-40" aria-label="Increase quantity">
            <Plus className="size-4" />
          </button>
        </div>
        <button type="button" onClick={add} disabled={!canBuy} className={cn("t-btn h-12 flex-1 disabled:cursor-not-allowed disabled:opacity-50", added ? "bg-emerald-600 text-white" : "t-btn-primary")}>
          {added ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
          {added ? t(sui.added, lang) : canBuy ? t(ui.addToCart, lang) : t(ui.outOfStock, lang)}
        </button>
        <button type="button" onClick={buyNow} disabled={!canBuy} className="t-btn t-btn-accent h-12 flex-1 disabled:cursor-not-allowed disabled:opacity-50">
          <Zap className="size-5" />
          {t(ui.buyNow, lang)}
        </button>
      </div>
      {added ? (
        <p className="text-sm">
          <Link href="/cart" className="font-medium text-t-primary underline underline-offset-4">
            {t(sui.viewCart, lang)} →
          </Link>
        </p>
      ) : null}

      {ctx.commerce.whatsappOrders && waNumber ? (
        <a href={whatsappLink(waNumber, waText)} target="_blank" rel="noreferrer" className="t-btn w-full border border-[#25D366] bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20">
          <MessageCircle className="size-5" />
          {t(sui.orderOnWhatsApp, lang)}
        </a>
      ) : null}
    </div>
  );
}
