import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";
import { PACKAGES_PAGE_SIZE } from "./constants";
import { isPackageKind } from "./helpers";

export interface PackageListOptions {
  kind?: string;
  destination?: string;
  q?: string;
  featured?: boolean;
  page?: number;
  take?: number;
}

/** Public package listing with kind/destination/keyword filters, pagination and kind counts. */
export const getPackages = cache(async (tenantId: string, opts: PackageListOptions = {}) => {
  const take = Math.min(Math.max(opts.take ?? PACKAGES_PAGE_SIZE, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const base: Prisma.TravelPackageWhereInput = { tenantId, isActive: true };
  const and: Prisma.TravelPackageWhereInput[] = [];
  if (opts.kind && isPackageKind(opts.kind)) and.push({ kind: opts.kind });
  if (opts.featured) and.push({ isFeatured: true });
  if (opts.destination) and.push({ destination: { contains: opts.destination, mode: "insensitive" } });
  const q = opts.q?.trim();
  if (q) {
    const qs = slugify(q);
    and.push({
      OR: [
        { title: { path: ["en"], string_contains: q } },
        ...(qs ? [{ slug: { contains: qs } }] : []),
        { destination: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.TravelPackageWhereInput = and.length ? { ...base, AND: and } : base;
  const [items, total, kinds] = await Promise.all([
    db.travelPackage.findMany({ where, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }], take, skip: (page - 1) * take }),
    db.travelPackage.count({ where }),
    db.travelPackage.groupBy({ by: ["kind"], where: base, _count: { _all: true } }),
  ]);
  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    kinds: kinds.map((k) => ({ value: k.kind, count: k._count._all })),
  };
});
export type PackageListResult = Awaited<ReturnType<typeof getPackages>>;

export const getPackage = cache(async (tenantId: string, slug: string) => db.travelPackage.findFirst({ where: { tenantId, slug, isActive: true } }));

/** Featured packages for home pages, topped up with newest ones when there are not enough featured. */
export const getFeaturedPackages = cache(async (tenantId: string, take = 6, kind?: string) => {
  const base: Prisma.TravelPackageWhereInput = { tenantId, isActive: true, ...(kind && isPackageKind(kind) ? { kind } : {}) };
  const featured = await db.travelPackage.findMany({ where: { ...base, isFeatured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take });
  if (featured.length >= take) return featured;
  const rest = await db.travelPackage.findMany({ where: { ...base, isFeatured: false }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: take - featured.length });
  return [...featured, ...rest];
});

/** Distinct destinations with active package counts. */
export const getDestinations = cache(async (tenantId: string) => {
  const rows = await db.travelPackage.groupBy({ by: ["destination"], where: { tenantId, isActive: true }, _count: { _all: true }, orderBy: { destination: "asc" } });
  return rows.map((r) => ({ destination: r.destination, count: r._count._all }));
});
