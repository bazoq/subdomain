"use server";

/**
 * REFERENCE public form action: any visitor on a tenant host can submit a lead.
 * Tenant from host -> honeypot -> rate limit -> zod -> per-form enrichment/verification
 * -> duplicate guard -> create -> best-effort owner notification.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import type { TenantContext } from "@/server/tenant";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { notifyNewLead } from "@/server/notify";
import { publicFailure, publicFormGuard, publicMessages } from "@/modules/shared/public-form";
import { ISO_DATE, normalizeContactPhone, parseExtraFields, zEmailOptional, zPhone } from "@/modules/shared/validation";

const leadSchema = z.object({
  formKey: z.string().regex(/^[a-z][a-z0-9_]{1,39}$/, "Invalid form").default("contact"),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: zPhone,
  email: zEmailOptional,
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  website: z.string().max(200).optional(), // honeypot (must be empty)
  /** extra form-specific fields as a JSON string (flat object) */
  extra: z.string().max(8000).optional(),
  fileIds: z.string().max(400).optional(), // comma separated Media ids (private uploads)
});

const DUPLICATE_WINDOW_MS = 2 * 60_000;
const MAX_FILES = 5;

type Enriched = { extra: Record<string, string>; subject?: string; error?: ActionResult<never> };

/**
 * Verify ids that public forms echo back (property, plan, service …) against the tenant and
 * replace client-supplied labels with the canonical DB values so admins never see spoofed data.
 */
async function enrichExtra(tc: TenantContext, formKey: string, extra: Record<string, string>, lang: "en" | "ur"): Promise<Enriched> {
  const out = { ...extra };
  const tenantId = tc.tenant.id;

  if (formKey === "property_inquiry" && out.propertyId) {
    const p = await db.property.findFirst({ where: { id: out.propertyId, tenantId, isActive: true }, select: { title: true, slug: true, price: true, purpose: true, priceUnit: true, location: true, city: true } });
    if (!p) return { extra: out, error: fail(t(publicMessages.unavailable, lang)) };
    const title = t(p.title as LocalizedString, "en");
    out.propertyTitle = title;
    out.slug = p.slug;
    out.price = `${formatPKR(p.price, { compact: true })}${p.priceUnit === "MONTHLY" || p.purpose === "RENT" ? "/month" : ""}`;
    out.location = `${p.location}, ${p.city}`;
    return { extra: out, subject: `Inquiry: ${title}` };
  }

  if (formKey === "gym_trial") {
    if (out.planId) {
      const plan = await db.membershipPlan.findFirst({ where: { id: out.planId, tenantId }, select: { name: true, price: true, period: true } });
      if (plan) out.plan = `${t(plan.name as LocalizedString, "en")} – ${formatPKR(plan.price)} / ${plan.period.toLowerCase()}`;
      else {
        delete out.planId;
        delete out.plan;
      }
    }
    return { extra: out };
  }

  if (formKey === "quote") {
    if (out.serviceId && out.serviceId !== "other") {
      const s = await db.service.findFirst({ where: { id: out.serviceId, tenantId }, select: { name: true } });
      if (s) out.service = t(s.name as LocalizedString, "en");
      else delete out.serviceId;
    }
    const qty = Number.parseInt(out.quantity ?? "", 10);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10_000_000) delete out.quantity;
    else out.quantity = String(qty);
    if (out.deadline && !ISO_DATE.test(out.deadline)) delete out.deadline;
    return { extra: out, subject: out.service ? `Quote: ${out.service}` : out.service_other || out.service ? `Quote: ${out.service_other ?? out.service}` : "Quote request" };
  }

  if (formKey === "consultation") {
    if (out.preferredDate && !ISO_DATE.test(out.preferredDate)) delete out.preferredDate;
    return { extra: out, subject: out.practiceArea ? `Consultation: ${out.practiceArea}` : "Consultation request" };
  }

  if (formKey === "employer_request") {
    const n = Number.parseInt(out.count ?? "", 10);
    if (!Number.isFinite(n) || n <= 0 || n > 100_000) delete out.count;
    else out.count = String(n);
    return { extra: out, subject: out.company ? `Employer request: ${out.company}` : "Employer request" };
  }

  return { extra: out };
}

export async function submitLead(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const guard = await publicFormGuard({ bucket: `form:${d.formKey}`, honeypot: d.website, limit: 5, windowSec: 600 });
  if (!guard.ok) return guard.result;
  const { tc, lang } = guard;

  try {
    const phone = normalizeContactPhone(d.phone);
    if (!phone) return fail(t(publicMessages.fixFields, lang), { phone: t(publicMessages.invalidPhone, lang) });

    const enriched = await enrichExtra(tc, d.formKey, parseExtraFields(d.extra), lang);
    if (enriched.error) return enriched.error;
    const subject = (d.subject || enriched.subject || "").slice(0, 150) || null;
    const message = d.message || null;

    // only accept private files uploaded for this tenant
    let fileIds = d.fileIds ? d.fileIds.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_FILES) : [];
    if (fileIds.length) {
      const owned = await db.media.findMany({ where: { id: { in: fileIds }, tenantId: tc.tenant.id, visibility: "PRIVATE", confirmed: true }, select: { id: true } });
      fileIds = owned.map((m) => m.id);
    }

    // duplicate-submit guard (double click / retry): same form, phone and message within 2 minutes
    const dup = await db.lead.findFirst({
      where: { tenantId: tc.tenant.id, formKey: d.formKey, phone, message, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
      select: { id: true },
    });
    if (dup) return success(t(ui.thankYou, lang));

    const lead = await db.lead.create({
      data: {
        tenantId: tc.tenant.id,
        formKey: d.formKey,
        name: d.name,
        phone,
        email: d.email || null,
        subject,
        message,
        data: json({ ...enriched.extra, lang }),
        fileIds,
        source: "website",
      },
    });
    void notifyNewLead(tc, { kind: "lead", id: lead.id, formKey: d.formKey, name: d.name, phone, email: d.email || null, subject, message, fields: enriched.extra, fileCount: fileIds.length });
    return success(t(ui.thankYou, lang));
  } catch (e) {
    return publicFailure(lang, e);
  }
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
      data: { status: s.data, ...(notes !== undefined ? { notes: notes.slice(0, 2000) || null } : {}) },
    });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "lead.status", entity: "Lead", entityId: id, meta: { status: s.data } });
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
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "lead.delete", entity: "Lead", entityId: id });
    revalidatePath("/admin/leads");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
