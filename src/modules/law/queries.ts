import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { getServices, getTeam } from "@/modules/shared/queries";

/**
 * Law firms reuse the shared tables: practice areas = Service, attorneys = TeamMember,
 * consultations = Lead(formKey "consultation"). These are thin, well-named readers.
 */
export const getPracticeAreas = cache(async (tenantId: string, take = 50) => getServices(tenantId, { take }));

export const getAttorneys = cache(async (tenantId: string, take = 20) => getTeam(tenantId, take));

/** Attorneys filtered by a specialty tag (case-insensitive contains). */
export const getAttorneysBySpecialty = cache(async (tenantId: string, specialty: string) => {
  const all = await getTeam(tenantId, 100);
  const q = specialty.trim().toLowerCase();
  return q ? all.filter((m) => m.specialties.some((s) => s.toLowerCase().includes(q))) : all;
});

/** Admin: recent consultation requests (also visible under /admin/leads?formKey=consultation). */
export const getConsultations = cache(async (tenantId: string, opts: { status?: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" | "SPAM"; take?: number } = {}) =>
  db.lead.findMany({ where: { tenantId, formKey: "consultation", ...(opts.status ? { status: opts.status } : {}) }, orderBy: { createdAt: "desc" }, take: opts.take ?? 25 }),
);

export const countNewConsultations = cache(async (tenantId: string) => db.lead.count({ where: { tenantId, formKey: "consultation", status: "NEW" } }));
