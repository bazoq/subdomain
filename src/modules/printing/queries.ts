import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { getServices } from "@/modules/shared/queries";
import { asPriceTiers } from "@/modules/shared/content-types";

/**
 * Printing shops reuse the shared tables: printing services = Service (features may hold
 * `[{ qty, price }]` tiers), quote requests = Lead(formKey "quote") with private files in fileIds.
 */
export const getPrintServices = cache(async (tenantId: string, opts: { featuredOnly?: boolean; take?: number } = {}) => getServices(tenantId, opts));

/** Services that have quantity price tiers configured (used by the estimator). */
export const getPricedServices = cache(async (tenantId: string) => {
  const rows = await getServices(tenantId, { take: 100 });
  return rows.map((s) => ({ ...s, tiers: asPriceTiers(s.features) })).filter((s) => s.tiers.length || s.priceFrom != null);
});

/** Admin: recent quote requests (also under /admin/leads?formKey=quote). */
export const getQuoteRequests = cache(async (tenantId: string, opts: { status?: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" | "SPAM"; take?: number } = {}) =>
  db.lead.findMany({ where: { tenantId, formKey: "quote", ...(opts.status ? { status: opts.status } : {}) }, orderBy: { createdAt: "desc" }, take: opts.take ?? 25 }),
);

export const countNewQuotes = cache(async (tenantId: string) => db.lead.count({ where: { tenantId, formKey: "quote", status: "NEW" } }));
