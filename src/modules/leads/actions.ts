"use server";

/**
 * REFERENCE public form action: any visitor on a tenant host can submit a lead.
 * Honeypot + rate limit + zod + tenant scoping from host.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { normalizePkPhone } from "@/lib/utils";
import { t, ui } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { notifyTenant } from "@/server/notify";

const leadSchema = z.object({
  formKey: z.string().regex(/^[a-z_]{2,40}$/).default("contact"),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  email: z.string().trim().email("Invalid email").max(120).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  website: z.string().max(0).optional(), // honeypot
  /** extra form-specific fields as JSON string */
  extra: z.string().max(8000).optional(),
  fileIds: z.string().max(400).optional(), // comma separated Media ids (private uploads)
});

export async function submitLead(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const tc = await requireTenant();
  const lang = await currentLang();
  const parsed = leadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(t(ui.thankYou, lang)); // bot: pretend success

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `form:${d.formKey}:${ip}`, limit: 5, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many submissions. Please try again later.");

  const phone = normalizePkPhone(d.phone) ?? d.phone;
  let extra: Record<string, unknown> = {};
  if (d.extra) {
    try {
      extra = JSON.parse(d.extra);
    } catch {
      extra = {};
    }
  }
  const fileIds = d.fileIds ? d.fileIds.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5) : [];
  if (fileIds.length) {
    // only accept files uploaded for this tenant
    const owned = await db.media.findMany({ where: { id: { in: fileIds }, tenantId: tc.tenant.id, confirmed: true }, select: { id: true } });
    fileIds.splice(0, fileIds.length, ...owned.map((m) => m.id));
  }

  const lead = await db.lead.create({
    data: {
      tenantId: tc.tenant.id,
      formKey: d.formKey,
      name: d.name,
      phone,
      email: d.email || null,
      subject: d.subject || null,
      message: d.message || null,
      data: json(extra),
      fileIds,
      source: "website",
    },
  });
  notifyTenant(tc, {
    subject: `New ${d.formKey.replace(/_/g, " ")} from ${d.name}`,
    text: `${d.name} (${phone})${d.email ? ` · ${d.email}` : ""}\n${d.subject ?? ""}\n\n${d.message ?? ""}\n\nOpen admin: /admin/leads/${lead.id}`,
  }).catch(() => undefined);
  return success(t(ui.thankYou, lang));
}

/* ---------------- admin ---------------- */

const statusSchema = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED", "SPAM"]);

export async function updateLeadStatus(id: string, status: string, notes?: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = statusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const { count } = await db.lead.updateMany({
      where: { id, tenantId: ctx.tenant.id },
      data: { status: s.data, ...(notes !== undefined ? { notes: notes.slice(0, 2000) } : {}) },
    });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "lead.status", entity: "Lead", entityId: id, meta: { status } });
    return success("Updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.lead.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    revalidatePath("/admin/leads");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
