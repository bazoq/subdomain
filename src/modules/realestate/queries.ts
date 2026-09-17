import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";
import { PROPERTIES_PAGE_SIZE } from "./constants";
import { isPropertyType, isPurpose, isSortKey } from "./helpers";

export interface PropertyListOptions {
  purpose?: string;
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  q?: string;
  featured?: boolean;
  page?: number;
  take?: number;
  sort?: string;
}

/** Public listings with filters, sorting, pagination and city facets. */
export const getProperties = cache(async (tenantId: string, opts: PropertyListOptions = {}) => {
  const take = Math.min(Math.max(opts.take ?? PROPERTIES_PAGE_SIZE, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const base: Prisma.PropertyWhereInput = { tenantId, isActive: true };
  const and: Prisma.PropertyWhereInput[] = [];
  if (opts.purpose && isPurpose(opts.purpose)) and.push({ purpose: opts.purpose });
  if (opts.type && isPropertyType(opts.type)) and.push({ type: opts.type });
  if (opts.city) and.push({ city: { equals: opts.city, mode: "insensitive" } });
  if (opts.minPrice && opts.minPrice > 0) and.push({ price: { gte: Math.round(opts.minPrice) } });
  if (opts.maxPrice && opts.maxPrice > 0) and.push({ price: { lte: Math.round(opts.maxPrice) } });
  if (opts.bedrooms && opts.bedrooms > 0) and.push({ bedrooms: { gte: Math.round(opts.bedrooms) } });
  if (opts.featured) and.push({ isFeatured: true });
  const q = opts.q?.trim();
  if (q) {
    const qs = slugify(q);
    and.push({
      OR: [
        { title: { path: ["en"], string_contains: q } },
        ...(qs ? [{ slug: { contains: qs } }] : []),
        { location: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.PropertyWhereInput = and.length ? { ...base, AND: and } : base;
  const sort = opts.sort && isSortKey(opts.sort) ? opts.sort : "newest";
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    sort === "price_asc" ? [{ price: "asc" }] : sort === "price_desc" ? [{ price: "desc" }] : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];

  const [items, total, cities] = await Promise.all([
    db.property.findMany({ where, orderBy, take, skip: (page - 1) * take }),
    db.property.count({ where }),
    db.property.groupBy({ by: ["city"], where: base, _count: { _all: true }, orderBy: { city: "asc" } }),
  ]);
  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    sort,
    facets: { cities: cities.map((c) => ({ value: c.city, count: c._count._all })) },
  };
});
export type PropertyListResult = Awaited<ReturnType<typeof getProperties>>;

export const getProperty = cache(async (tenantId: string, slug: string) => db.property.findFirst({ where: { tenantId, slug, isActive: true } }));

/** Featured listings for home pages, topped up with the newest when there are not enough featured. */
export const getFeaturedProperties = cache(async (tenantId: string, take = 6, purpose?: string) => {
  const base: Prisma.PropertyWhereInput = { tenantId, isActive: true, ...(purpose && isPurpose(purpose) ? { purpose } : {}) };
  const featured = await db.property.findMany({ where: { ...base, isFeatured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take });
  if (featured.length >= take) return featured;
  const rest = await db.property.findMany({ where: { ...base, isFeatured: false }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: take - featured.length });
  return [...featured, ...rest];
});

/** Active agents (TeamMember rows) for this tenant. */
export const getAgents = cache(async (tenantId: string) => db.teamMember.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" } }));

export const getAgent = cache(async (tenantId: string, id: string) => db.teamMember.findFirst({ where: { id, tenantId, isActive: true } }));

/** Distinct cities with active listing counts (for search bars on home pages). */
export const getPropertyCities = cache(async (tenantId: string) => {
  const rows = await db.property.groupBy({ by: ["city"], where: { tenantId, isActive: true }, _count: { _all: true }, orderBy: { city: "asc" } });
  return rows.map((r) => ({ value: r.city, count: r._count._all }));
});
