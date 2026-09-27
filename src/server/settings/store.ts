import "server-only";
import { db, json, type DbOrTx } from "@/server/db";
import { parseSettings, tenantSettingsSchema, type TenantSettings } from "@/lib/tenant-settings";

/**
 * The single place that reads and writes `Tenant.settings`.
 *
 * `Tenant.settings` is one JSON document validated by `tenantSettingsSchema`. Modules that flip a
 * flag (e.g. restaurant "accepting orders") must go through `updateTenantSettings()` so that the
 * whole document is re-validated, unknown keys are dropped, and concurrent edits to other sections
 * are not overwritten with a stale copy: the mutation runs against the freshly read row.
 */

export async function readTenantSettings(tenantId: string, client: DbOrTx = db): Promise<TenantSettings> {
  const row = await client.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  if (!row) throw new Error("Tenant not found.");
  return parseSettings(row.settings);
}

/**
 * Read → mutate → validate → write, inside a transaction so two admins saving different sections at
 * the same time cannot clobber each other. Returns the persisted, validated settings.
 */
export async function updateTenantSettings(tenantId: string, mutate: (current: TenantSettings) => TenantSettings | Record<string, unknown>): Promise<TenantSettings> {
  return db.$transaction(async (tx) => {
    const current = await readTenantSettings(tenantId, tx);
    const next = tenantSettingsSchema.parse(mutate(current));
    await tx.tenant.update({ where: { id: tenantId }, data: { settings: json(next) } });
    return next;
  });
}
