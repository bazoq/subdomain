import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 client (driver adapter: node-postgres) — one instance per process.
 *
 * Runtime URL (`DATABASE_URL`) is Supabase's transaction pooler (port 6543). With a driver adapter
 * Prisma does not parse the URL itself, so the `?pgbouncer=true&connection_limit=1` suffix from the
 * docs is harmless (pg ignores unknown params) and the real pool size is `max` below. node-pg sends
 * unnamed prepared statements, which transaction-mode pooling (PgBouncer / Supavisor) supports, and
 * interactive transactions pin one connection for their duration, so `$transaction` is safe too.
 *
 * Dev: the instance is cached on `globalThis` so Next.js hot reloads do not open a new pool each time.
 * `DB_LOG_QUERIES=1` prints every query (dev only). `DB_POOL_MAX` overrides the pool size.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function poolMax(): number {
  const raw = Number(process.env.DB_POOL_MAX);
  if (Number.isInteger(raw) && raw > 0) return Math.min(raw, 50);
  // Serverless: a function instance runs a handful of queries concurrently at most and the pooler
  // multiplexes for us; a large pool would only exhaust Supabase's client limit. Local dev: parallel
  // RSC queries benefit from a few more.
  return process.env.VERCEL ? 3 : 10;
}

function logLevels(): Prisma.LogLevel[] {
  if (process.env.NODE_ENV === "production") return ["error"];
  return process.env.DB_LOG_QUERIES === "1" ? ["query", "warn", "error"] : ["warn", "error"];
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example and docs/DEPLOY.md §1)");
  const adapter = new PrismaPg({
    connectionString,
    max: poolMax(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter, log: logLevels() });
}

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Db = typeof db;
/** Client handed to `db.$transaction(async (tx) => …)` callbacks. */
export type Tx = Prisma.TransactionClient;
/** Either the root client or a transaction client — for helpers that work in both. */
export type DbOrTx = Db | Tx;

/** Cast validated plain objects/arrays for Prisma Json columns. */
export function json<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/* ───────────────────────── typed error helpers ─────────────────────────
 * Prisma error codes: https://www.prisma.io/docs/orm/reference/error-reference
 *   P2002 unique constraint · P2003 foreign key · P2025 record not found ·
 *   P2034 transaction conflict / deadlock (retryable)
 */

export function isPrismaError(e: unknown, code?: string): e is Prisma.PrismaClientKnownRequestError {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) {
    // The same class can be loaded twice in dev (generated client vs. bundled copy); fall back to shape.
    const shaped = typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "string" && "clientVersion" in e;
    if (!shaped) return false;
  }
  return code === undefined || (e as { code: string }).code === code;
}

/** Columns named in a P2002 unique-constraint error (e.g. `["tenantId", "slug"]`), or `[]`. */
export function uniqueViolationFields(e: unknown): string[] {
  if (!isPrismaError(e, "P2002")) return [];
  const target = (e.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === "string") return target.split(/[,\s]+/).filter(Boolean);
  return [];
}

/**
 * True for a unique-constraint violation. Pass `field` to check that a specific column is part of the
 * violated constraint (e.g. `isUniqueViolation(e, "slug")` for `@@unique([tenantId, slug])`).
 */
export function isUniqueViolation(e: unknown, field?: string): boolean {
  if (!isPrismaError(e, "P2002")) return false;
  if (!field) return true;
  const fields = uniqueViolationFields(e);
  // Some drivers only report the constraint name (e.g. "Product_tenantId_slug_key"); match that too.
  return fields.length === 0 ? true : fields.some((f) => f === field || f.includes(`_${field}_`) || f.endsWith(`_${field}`));
}

/** Record to update/delete does not exist (P2025). */
export function isNotFound(e: unknown): boolean {
  return isPrismaError(e, "P2025");
}

/** Foreign-key violation (P2003): the referenced row is missing or the row is still referenced. */
export function isForeignKeyViolation(e: unknown): boolean {
  return isPrismaError(e, "P2003");
}

/** Serialization failure / deadlock inside a transaction (P2034) — safe to retry the whole transaction. */
export function isTransactionConflict(e: unknown): boolean {
  return isPrismaError(e, "P2034");
}

/**
 * Re-run `fn` when it fails with a retryable conflict (P2034, or P2002 when `retryOnUnique` is set —
 * e.g. per-tenant order numbers computed as max+1). Exponential backoff with jitter; rethrows the last error.
 */
export async function withDbRetry<T>(fn: (attempt: number) => Promise<T>, opts: { retries?: number; retryOnUnique?: boolean; baseDelayMs?: number } = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 25;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      const retryable = isTransactionConflict(e) || (opts.retryOnUnique === true && isUniqueViolation(e));
      if (!retryable || attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, base * 2 ** attempt + Math.random() * base));
    }
  }
  throw lastError;
}

/**
 * Short, user-safe message for a database error (never echoes SQL, constraint names or driver text).
 * Use in server actions: `return fail(dbErrorMessage(e))`.
 */
export function dbErrorMessage(e: unknown, fallback = "Something went wrong while saving. Please try again."): string {
  if (isUniqueViolation(e)) {
    const f = uniqueViolationFields(e).filter((x) => x !== "tenantId");
    return f.length ? `A record with the same ${f.join(" / ")} already exists.` : "A record with the same details already exists.";
  }
  if (isNotFound(e)) return "The record no longer exists.";
  if (isForeignKeyViolation(e)) return "This record is linked to other data and cannot be changed that way.";
  if (isTransactionConflict(e)) return "The data was changed by someone else at the same time. Please try again.";
  return fallback;
}
