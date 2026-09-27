import "server-only";
import { db } from "@/server/db";
import { clientIp } from "@/server/rate-limit";
import { log, errorFields } from "@/lib/log";
import type { SessionKind } from "@/generated/prisma/client";

/**
 * Append-only audit trail. Never throws (an audit failure must not break the action), never
 * stores secrets: `meta` is passed through `redactMeta`, which masks values under keys that look
 * like credentials and bounds depth, array length, string length and total size.
 */

const SENSITIVE_KEY = /pass(word|phrase)?|pwd|secret|token|hash|authorization|cookie|session|api[-_]?key|access[-_]?key|private[-_]?key|credential|otp|pin$/i;
const MAX_DEPTH = 6;
const MAX_ARRAY = 100;
const MAX_STRING = 2000;
const MAX_BYTES = 16 * 1024;
const REDACTED = "[redacted]";

export function redactMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const out = walk(meta, 0) as Record<string, unknown>;
  try {
    if (JSON.stringify(out).length > MAX_BYTES) return { truncated: true, keys: Object.keys(meta).slice(0, 50) };
  } catch {
    return { unserialisable: true };
  }
  return out;
}

function walk(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return "[depth]";
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((v) => walk(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "function" || typeof v === "symbol") continue;
      out[k] = SENSITIVE_KEY.test(k) ? REDACTED : walk(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

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
        actorId: input.actorId.slice(0, 64),
        actorName: input.actorName.slice(0, 120),
        action: input.action.slice(0, 80),
        entity: input.entity?.slice(0, 64),
        entityId: input.entityId?.slice(0, 64),
        meta: redactMeta(input.meta) as object,
        ip: ip === "unknown" ? null : ip,
      },
    });
  } catch (err) {
    log.error("audit.failed", { action: input.action, ...errorFields(err) });
  }
}
