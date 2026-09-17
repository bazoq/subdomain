import type { ProductSort } from "./queries";

/** Helpers shared by the /shop and /shop/c/[category] pages for reading and building `?q=&sort=&page=`. */
export type ShopSearch = { q?: string; sort?: string; page?: string };

const SORTS: ProductSort[] = ["featured", "newest", "price_asc", "price_desc"];

export function parseShopSearch(sp: ShopSearch): { q?: string; sort: ProductSort; page: number } {
  const sort = SORTS.includes(sp.sort as ProductSort) ? (sp.sort as ProductSort) : "featured";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  return { q: sp.q?.trim() || undefined, sort, page };
}

export function shopHref(base: string, opts: { q?: string; sort?: ProductSort; page?: number }): string {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.sort && opts.sort !== "featured") p.set("sort", opts.sort);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
