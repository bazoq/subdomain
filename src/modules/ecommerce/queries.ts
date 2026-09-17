import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";
import { toCategoryDTO, toOrderDTO, toProductDTO, toShippingZoneDTO } from "./mappers";
import type { CategoryDTO, OrderDTO, ProductDTO, ShippingZoneDTO } from "./types";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "featured";

export interface ProductQuery {
  categorySlug?: string;
  q?: string;
  sort?: ProductSort;
  page?: number;
  take?: number;
  featured?: boolean;
  tags?: string[];
}

export interface ProductPage {
  items: ProductDTO[];
  total: number;
  page: number;
  pageCount: number;
}

const productInclude = { category: true, variants: { where: { isActive: true }, orderBy: { id: "asc" } } } satisfies Prisma.ProductInclude;

/** Active categories (with active product counts), ordered for display. */
export const getCategories = cache(async (tenantId: string): Promise<CategoryDTO[]> => {
  const rows = await db.productCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return rows.map(toCategoryDTO);
});

function orderBy(sort: ProductSort | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Paginated storefront listing. */
export const getProducts = cache(async (tenantId: string, opts: ProductQuery = {}): Promise<ProductPage> => {
  const take = Math.min(60, Math.max(1, opts.take ?? 24));
  const page = Math.max(1, opts.page ?? 1);
  const q = opts.q?.trim().slice(0, 80);
  const where: Prisma.ProductWhereInput = {
    tenantId,
    isActive: true,
    ...(opts.featured ? { isFeatured: true } : {}),
    ...(opts.categorySlug ? { category: { tenantId, slug: opts.categorySlug } } : {}),
    ...(opts.tags?.length ? { tags: { hasSome: opts.tags } } : {}),
  };
  if (q) {
    // JSON string filters are case-sensitive in Postgres, so we search a few casings plus the slug (always lowercase).
    const slugQ = slugify(q);
    where.OR = [
      ...(slugQ ? [{ slug: { contains: slugQ } }] : []),
      { name: { path: ["en"], string_contains: q } },
      { name: { path: ["en"], string_contains: q.toLowerCase() } },
      { name: { path: ["en"], string_contains: capitalise(q.toLowerCase()) } },
      { name: { path: ["ur"], string_contains: q } },
      { sku: { contains: q, mode: "insensitive" } },
      { genericName: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: orderBy(opts.sort), take, skip: (page - 1) * take, include: productInclude }),
  ]);
  return { items: rows.map(toProductDTO), total, page, pageCount: Math.max(1, Math.ceil(total / take)) };
});

/** Single active product by slug with variants + category; null when missing. */
export const getProduct = cache(async (tenantId: string, slug: string): Promise<ProductDTO | null> => {
  const row = await db.product.findFirst({ where: { tenantId, slug, isActive: true }, include: productInclude });
  return row ? toProductDTO(row) : null;
});

/** Other active products from the same category (falls back to featured / newest). */
export const getRelatedProducts = cache(async (tenantId: string, product: Pick<ProductDTO, "id" | "category">, take = 4): Promise<ProductDTO[]> => {
  const base: Prisma.ProductWhereInput = { tenantId, isActive: true, id: { not: product.id } };
  let rows = product.category
    ? await db.product.findMany({ where: { ...base, categoryId: product.category.id }, orderBy: orderBy("featured"), take, include: productInclude })
    : [];
  if (rows.length < take) {
    const more = await db.product.findMany({
      where: { ...base, id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
      orderBy: orderBy("featured"),
      take: take - rows.length,
      include: productInclude,
    });
    rows = [...rows, ...more];
  }
  return rows.map(toProductDTO);
});

export const getFeaturedProducts = cache(async (tenantId: string, take = 8): Promise<ProductDTO[]> => {
  const rows = await db.product.findMany({ where: { tenantId, isActive: true, isFeatured: true }, orderBy: orderBy("featured"), take, include: productInclude });
  return rows.map(toProductDTO);
});

export const getShippingZones = cache(async (tenantId: string): Promise<ShippingZoneDTO[]> => {
  const rows = await db.shippingZone.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return rows.map(toShippingZoneDTO);
});

/** Order by number for the public order page (caller must verify the phone before showing details). */
export const getOrderByNumber = cache(async (tenantId: string, number: number): Promise<OrderDTO | null> => {
  if (!Number.isFinite(number) || number <= 0) return null;
  const row = await db.order.findFirst({ where: { tenantId, number }, include: { items: { include: { product: { select: { slug: true } } } } } });
  return row ? toOrderDTO(row) : null;
});

export const getCategoryBySlug = cache(async (tenantId: string, slug: string): Promise<CategoryDTO | null> => {
  const row = await db.productCategory.findFirst({ where: { tenantId, slug, isActive: true }, include: { _count: { select: { products: { where: { isActive: true } } } } } });
  return row ? toCategoryDTO(row) : null;
});
