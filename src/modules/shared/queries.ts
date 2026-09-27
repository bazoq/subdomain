import "server-only";
import { cache } from "react";
import { db } from "@/server/db";

/** Public, tenant-scoped reads used by templates. All cached per request. */

export const getTestimonials = cache(async (tenantId: string, take = 12) =>
  db.testimonial.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" }, take }),
);

export const getFaqs = cache(async (tenantId: string) =>
  db.faqItem.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" } }),
);

export const getGallery = cache(async (tenantId: string, album?: string, take = 24) =>
  db.galleryItem.findMany({
    where: { tenantId, ...(album && album !== "all" ? { album } : {}) },
    orderBy: { sortOrder: "asc" },
    take,
  }),
);

export const getTeam = cache(async (tenantId: string, take = 12) =>
  db.teamMember.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" }, take }),
);

export const getTeamMember = cache(async (tenantId: string, slug: string) =>
  db.teamMember.findFirst({ where: { tenantId, slug, isActive: true } }),
);

export const getServices = cache(async (tenantId: string, opts: { featuredOnly?: boolean; take?: number } = {}) =>
  db.service.findMany({
    where: { tenantId, isActive: true, ...(opts.featuredOnly ? { isFeatured: true } : {}) },
    orderBy: { sortOrder: "asc" },
    take: opts.take ?? 50,
  }),
);

export const getService = cache(async (tenantId: string, slug: string) =>
  db.service.findFirst({ where: { tenantId, slug, isActive: true } }),
);

/** Posts that are published AND whose publish date has passed (future dates = scheduled, hidden). */
export function publicPostsWhere(tenantId: string) {
  return { tenantId, published: true, publishedAt: { lte: new Date() } };
}

export const getPosts = cache(async (tenantId: string, take = 12) =>
  db.tenantPost.findMany({ where: publicPostsWhere(tenantId), orderBy: { publishedAt: "desc" }, take }),
);

export const getPost = cache(async (tenantId: string, slug: string) =>
  db.tenantPost.findFirst({ where: { ...publicPostsWhere(tenantId), slug } }),
);

export const getPage = cache(async (tenantId: string, slug: string) =>
  db.sitePage.findFirst({ where: { tenantId, slug, enabled: true } }),
);
