import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { slugify } from "@/lib/utils";
import { JOBS_PAGE_SIZE } from "./constants";
import { startOfToday } from "./helpers";

export interface JobListOptions {
  q?: string;
  location?: string;
  type?: string;
  country?: string;
  department?: string;
  featured?: boolean;
  page?: number;
  take?: number;
}

export interface JobFacets {
  locations: { value: string; count: number }[];
  types: { value: string; count: number }[];
  countries: { value: string; count: number }[];
}

function openJobsWhere(tenantId: string): Prisma.JobWhereInput {
  return { tenantId, isActive: true, OR: [{ deadline: null }, { deadline: { gte: startOfToday() } }] };
}

/** Public job board listing with filters, pagination and facets. Tenant-scoped, open jobs only. */
export const getJobs = cache(async (tenantId: string, opts: JobListOptions = {}) => {
  const take = Math.min(Math.max(opts.take ?? JOBS_PAGE_SIZE, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const base = openJobsWhere(tenantId);
  const and: Prisma.JobWhereInput[] = [];
  if (opts.featured) and.push({ isFeatured: true });
  if (opts.location) and.push({ location: { contains: opts.location, mode: "insensitive" } });
  if (opts.type) and.push({ type: opts.type });
  if (opts.country) and.push({ country: opts.country });
  if (opts.department) and.push({ department: { equals: opts.department, mode: "insensitive" } });
  const q = opts.q?.trim();
  if (q) {
    const qs = slugify(q);
    and.push({
      OR: [
        { title: { path: ["en"], string_contains: q } },
        ...(qs ? [{ slug: { contains: qs } }] : []),
        { company: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const where: Prisma.JobWhereInput = and.length ? { ...base, AND: and } : base;

  const [items, total, locations, types, countries] = await Promise.all([
    db.job.findMany({ where, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take, skip: (page - 1) * take }),
    db.job.count({ where }),
    db.job.groupBy({ by: ["location"], where: base, _count: { _all: true }, orderBy: { location: "asc" } }),
    db.job.groupBy({ by: ["type"], where: base, _count: { _all: true }, orderBy: { type: "asc" } }),
    db.job.groupBy({ by: ["country"], where: base, _count: { _all: true }, orderBy: { country: "asc" } }),
  ]);
  const facets: JobFacets = {
    locations: locations.map((r) => ({ value: r.location, count: r._count._all })),
    types: types.map((r) => ({ value: r.type, count: r._count._all })),
    countries: countries.map((r) => ({ value: r.country, count: r._count._all })),
  };
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / take)), facets };
});
export type JobListResult = Awaited<ReturnType<typeof getJobs>>;

/** Single active job by slug (expired jobs are still viewable; applying is blocked). */
export const getJob = cache(async (tenantId: string, slug: string) => db.job.findFirst({ where: { tenantId, slug, isActive: true } }));

/** Featured open jobs for home pages, topped up with the latest jobs when there are not enough featured ones. */
export const getFeaturedJobs = cache(async (tenantId: string, take = 6) => {
  const base = openJobsWhere(tenantId);
  const featured = await db.job.findMany({ where: { ...base, isFeatured: true }, orderBy: { createdAt: "desc" }, take });
  if (featured.length >= take) return featured;
  const rest = await db.job.findMany({
    where: { ...base, isFeatured: false },
    orderBy: { createdAt: "desc" },
    take: take - featured.length,
  });
  return [...featured, ...rest];
});

/** Open-job counts per department (for the categories strip). */
export const getJobDepartments = cache(async (tenantId: string) => {
  const rows = await db.job.groupBy({
    by: ["department"],
    where: { ...openJobsWhere(tenantId), department: { not: null } },
    _count: { _all: true },
  });
  return rows
    .filter((r): r is typeof r & { department: string } => !!r.department)
    .map((r) => ({ department: r.department, count: r._count._all }))
    .sort((a, b) => b.count - a.count || a.department.localeCompare(b.department));
});
