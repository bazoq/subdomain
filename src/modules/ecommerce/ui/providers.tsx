import type { SiteContext } from "@/templates/types";
import { toStoreCtx } from "../types";
import { CartProvider } from "./cart-provider";

/**
 * Server wrapper that mounts the CartProvider with a serialisable slice of the site context.
 * Use it at page level (shop pages already do) or in a template Layout; nesting is safe.
 */
export function EcommerceProviders({ ctx, children }: { ctx: SiteContext; children: React.ReactNode }) {
  return (
    <CartProvider host={ctx.host} store={toStoreCtx(ctx)}>
      {children}
    </CartProvider>
  );
}
