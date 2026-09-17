"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { parseSettings, tenantSettingsSchema, type TenantSettings } from "@/lib/tenant-settings";
import { normalizePkPhone } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

export type SettingsSection = keyof TenantSettings;

const SECTIONS: SettingsSection[] = ["branding", "contact", "social", "languages", "commerce", "restaurant", "hours", "seo", "notifications", "announcement"];

/**
 * Merge a partial update for one settings section into Tenant.settings.
 * The whole object is re-validated with `tenantSettingsSchema` so bad data never lands.
 */
export async function saveSettings(section: SettingsSection, partial: unknown): Promise<ActionResult<{ settings: TenantSettings }>> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!SECTIONS.includes(section)) return fail("Unknown settings section.");
    if (section === "commerce" && !ctx.category.modules.includes("ecommerce")) return fail("Not available for this business type.");
    if (section === "restaurant" && !ctx.category.modules.includes("restaurant")) return fail("Not available for this business type.");

    const fresh = await db.tenant.findUnique({ where: { id: ctx.tenant.id }, select: { settings: true } });
    const current = parseSettings(fresh?.settings);
    const incoming = normaliseIncoming(section, partial);
    const merged: Record<string, unknown> = { ...current };
    merged[section] = Array.isArray(incoming) || section === "hours" ? incoming : { ...(current[section] as object), ...(incoming as object) };

    const parsed = tenantSettingsSchema.safeParse(merged);
    if (!parsed.success) {
      const r = fromZod(parsed.error);
      // strip the section prefix so field errors map to the form fields
      const fieldErrors = Object.fromEntries(Object.entries(r.ok ? {} : (r.fieldErrors ?? {})).map(([k, v]) => [k.replace(`${section}.`, ""), v]));
      return fail("Please fix the highlighted fields.", fieldErrors);
    }
    await db.tenant.update({ where: { id: ctx.tenant.id }, data: { settings: json(parsed.data) } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "settings.update", entity: "Tenant", entityId: ctx.tenant.id, meta: { section } });
    revalidatePath("/", "layout");
    return success("Settings saved.", { settings: parsed.data });
  } catch (e) {
    return fail((e as Error).message);
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
  if (section === "contact") {
    for (const k of ["phone", "phone2", "whatsapp"]) {
      const v = obj[k];
      if (typeof v === "string" && v) obj[k] = normalizePkPhone(v) ?? v;
    }
    if (obj.mapEmbedUrl === "") delete obj.mapEmbedUrl;
    if (obj.phone2 === "") delete obj.phone2;
  }
  if (section === "notifications") {
    const w = obj.whatsappTo;
    if (typeof w === "string" && w) obj.whatsappTo = normalizePkPhone(w) ?? w;
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
