"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage } from "@/server/db";
import { readTenantSettings, updateTenantSettings } from "@/server/settings/store";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { SETTINGS_MESSAGES, settingsFieldErrors, tenantSettingsWriteSchema, type SettingsSection, type TenantSettings } from "@/lib/tenant-settings";
import { fail, success, type ActionResult } from "@/lib/action-result";

export type { SettingsSection };

const SECTIONS: SettingsSection[] = ["branding", "contact", "social", "languages", "commerce", "restaurant", "hours", "seo", "notifications", "announcement"];

/**
 * Merge a partial update for one settings section into Tenant.settings.
 * Strict on write: the merged section must pass `tenantSettingsWriteSchema` (PK phones normalised,
 * e-mails, safe http(s) links, hex colours, SEO lengths); zod issues come back as bilingual field errors
 * keyed the way the settings form expects. The store then re-validates the whole document with the
 * lenient read schema so a legacy value in another section never blocks this save.
 */
export async function saveSettings(section: SettingsSection, partial: unknown): Promise<ActionResult<{ settings: TenantSettings }>> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!SECTIONS.includes(section)) return fail("Unknown settings section.");
    if (section === "commerce" && !ctx.category.modules.includes("ecommerce")) return fail("Not available for this business type.");
    if (section === "restaurant" && !ctx.category.modules.includes("restaurant")) return fail("Not available for this business type.");

    const current = await readTenantSettings(ctx.tenant.id);
    const incoming = normaliseIncoming(section, partial);
    const mergedSection: unknown = section === "hours" ? incoming : { ...(current[section] as object), ...(incoming as object) };

    const parsed = tenantSettingsWriteSchema.shape[section].safeParse(mergedSection);
    if (!parsed.success) return fail(SETTINGS_MESSAGES.fixFields, settingsFieldErrors(section, parsed.error, mergedSection));
    // Re-read inside the transaction and replace only this section, so a concurrent save of another
    // section (or the restaurant "accepting orders" switch) is never overwritten with our stale copy.
    const saved = await updateTenantSettings(ctx.tenant.id, (latest) => ({ ...latest, [section]: parsed.data }));
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "settings.update", entity: "Tenant", entityId: ctx.tenant.id, meta: { section } });
    revalidatePath("/", "layout");
    return success("Settings saved.", { settings: saved });
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

function normaliseIncoming(section: SettingsSection, partial: unknown): unknown {
  if (section === "hours") {
    if (!Array.isArray(partial)) return [];
    return partial
      .map((h) => (h && typeof h === "object" ? h : null))
      .filter(Boolean)
      .map((h) => {
        const x = h as { day?: unknown; open?: unknown; close?: unknown; closed?: unknown };
        return { day: Number(x.day), open: String(x.open ?? "09:00"), close: String(x.close ?? "21:00"), closed: Boolean(x.closed) };
      })
      .filter((h) => Number.isInteger(h.day) && h.day >= 0 && h.day <= 6)
      .sort((a, b) => a.day - b.day);
  }
  if (!partial || typeof partial !== "object") return {};
  const obj = { ...(partial as Record<string, unknown>) };
  // trim strings; drop empty optional strings so zod defaults apply
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") obj[k] = v.trim();
  }
  // phones / e-mails / links / colours are normalised and rejected by tenantSettingsWriteSchema
  if (section === "contact") {
    if (obj.mapEmbedUrl === "") delete obj.mapEmbedUrl;
    if (obj.phone2 === "") delete obj.phone2;
  }
  if (section === "commerce" || section === "restaurant") {
    for (const [k, v] of Object.entries(obj)) if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v)) && k !== "orderPrefix" && k !== "currency") obj[k] = Number(v);
    if (obj.freeShippingAbove === "" || obj.freeShippingAbove === 0) delete obj.freeShippingAbove;
  }
  if (section === "branding" || section === "social" || section === "seo" || section === "notifications") {
    for (const [k, v] of Object.entries(obj)) if (v === "") obj[k] = undefined;
  }
  return obj;
}
