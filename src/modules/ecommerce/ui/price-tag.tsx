import { cn, formatPKR } from "@/lib/utils";
import { salePercent } from "../pricing";

/** Price with optional struck-through compare price and % off pill. */
export function PriceTag({
  price,
  comparePrice,
  from,
  size = "md",
  className,
  showPercent = true,
}: {
  price: number;
  comparePrice?: number | null;
  /** prefix "From" when the product has cheaper variants */
  from?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPercent?: boolean;
}) {
  const pct = salePercent(price, comparePrice ?? null);
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {from ? <span className="text-xs text-t-muted-fg">{from}</span> : null}
      <span className={cn("font-heading font-bold text-t-fg", sizes[size])}>{formatPKR(price)}</span>
      {pct ? (
        <>
          <span className={cn("text-t-muted-fg line-through", size === "lg" ? "text-base" : "text-xs")}>{formatPKR(comparePrice as number)}</span>
          {showPercent ? <span className="rounded-full bg-t-accent px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-t-accent-fg">-{pct}%</span> : null}
        </>
      ) : null}
    </span>
  );
}
