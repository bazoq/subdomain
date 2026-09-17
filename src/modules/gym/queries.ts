import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { ClassSchedule, MembershipPlan, TeamMember } from "@/generated/prisma/client";

export type ClassWithTrainer = ClassSchedule & { trainer: Pick<TeamMember, "id" | "name" | "slug" | "imageUrl"> | null };

export const getPlans = cache(async (tenantId: string): Promise<MembershipPlan[]> =>
  db.membershipPlan.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] }),
);

/** Active classes with their trainer joined manually (no FK in schema). */
export const getClasses = cache(async (tenantId: string, opts: { includeInactive?: boolean } = {}): Promise<ClassWithTrainer[]> => {
  const rows = await db.classSchedule.findMany({
    where: { tenantId, ...(opts.includeInactive ? {} : { isActive: true }) },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const trainerIds = Array.from(new Set(rows.map((r) => r.trainerId).filter((x): x is string => !!x)));
  const trainers = trainerIds.length
    ? await db.teamMember.findMany({ where: { tenantId, id: { in: trainerIds } }, select: { id: true, name: true, slug: true, imageUrl: true } })
    : [];
  const byId = new Map(trainers.map((t) => [t.id, t]));
  return rows.map((r) => ({ ...r, trainer: r.trainerId ? (byId.get(r.trainerId) ?? null) : null }));
});

/** Classes grouped by weekday (0 = Sunday … 6 = Saturday). Days without classes are still present. */
export const getClassesByDay = cache(async (tenantId: string): Promise<Record<number, ClassWithTrainer[]>> => {
  const rows = await getClasses(tenantId);
  const out: Record<number, ClassWithTrainer[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const r of rows) out[r.dayOfWeek]?.push(r);
  return out;
});

export const getTrainers = cache(async (tenantId: string) =>
  db.teamMember.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, imageUrl: true } }),
);
