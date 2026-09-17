"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { maxQtyFor } from "../pricing";
import type { ProductDTO } from "../types";
import { useCart } from "./cart-provider";
import { sui } from "./strings";

/** One-click add for simple (variant-less) products on cards. */
export function QuickAddButton({ product, lang, className }: { product: ProductDTO; lang: Lang; className?: string }) {
  const cart = useCart();
  const [added, setAdded] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: t(product.name, lang),
        imageUrl: product.images[0],
        unitPrice: product.price,
        requiresPrescription: product.requiresPrescription,
        maxQty: maxQtyFor(product),
      },
      1,
    );
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(sui.quickAdd, lang)}
      className={cn("t-btn px-3 py-2 text-sm", added ? "bg-emerald-600 text-white" : "t-btn-primary", className)}
    >
      {added ? <Check className="size-4" /> : <Plus className="size-4" />}
      <span>{added ? t(sui.added, lang) : t(sui.quickAdd, lang)}</span>
    </button>
  );
}
