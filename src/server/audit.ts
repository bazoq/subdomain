import "server-only";
import { db } from "@/server/db";
import { clientIp } from "@/server/rate-limit";
import type { SessionKind } from "@/generated/prisma/client";

export async function audit(input: {
  tenantId?: string | null;
  actorKind: SessionKind;
  actorId: string;
  actorName: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const ip = await clientIp();
    await db.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        actorKind: input.actorKind,
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: (input.meta ?? {}) as object,
        ip,
      },
    });
  } catch (err) {
    console.error("audit failed", err);
  }
}
