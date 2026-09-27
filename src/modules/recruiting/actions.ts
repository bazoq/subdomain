"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { notifyNewLead } from "@/server/notify";
import { slugify } from "@/lib/utils";
import { t, type LocalizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { publicFailure, publicFormGuard, publicMessages } from "@/modules/shared/public-form";
import { deleteTenantPrivateMedia, findPrivateUpload } from "@/modules/shared/media";
import { normalizeContactPhone, sanitizeLocalized } from "@/modules/shared/validation";
import { applySchema, applicationStatusSchema, jobSchema } from "./schema";
import { rs } from "./strings";
import { isJobExpired } from "./helpers";
import { APPLICATION_DUPLICATE_HOURS, CV_FOLDER, CV_MIME_TYPES, allowedApplicationTransitions, canTransitionApplication, type ApplicationStatusKey } from "./constants";

/* ───────────────────────── public ───────────────────────── */

/**
 * Visitor applies to a job (JSON input from the ApplyForm client component).
 * tenant from host -> honeypot -> rate limit -> zod -> job open? -> CV verified (private, document, this tenant)
 * -> duplicate guard (same job + phone within 24h is idempotent) -> create -> owner notification.
 */
export async function applyToJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const guard = await publicFormGuard({ bucket: "apply", honeypot: d.website, limit: 5, windowSec: 3600 });
  if (!guard.ok) return guard.result;
  const { tc, lang, ip } = guard;

  try {
    const phone = normalizeContactPhone(d.phone);
    if (!phone) return fail(t(publicMessages.fixFields, lang), { phone: t(publicMessages.invalidPhone, lang) });

    const job = await db.job.findFirst({ where: { id: d.jobId, tenantId: tc.tenant.id, isActive: true } });
    if (!job) return fail(t(rs.jobUnavailable, lang));
    if (isJobExpired(job.deadline)) return fail(t(rs.jobClosed, lang));

    // The CV must be a confirmed PRIVATE upload for this tenant, in the cv folder, with a document mime type.
    const cv = await findPrivateUpload(tc.tenant.id, d.cvMediaId, { folder: CV_FOLDER });
    if (!cv) return fail(t(rs.cvInvalid, lang), { cvMediaId: t(rs.cvInvalid, lang) });
    if (!(CV_MIME_TYPES as readonly string[]).includes(cv.mime)) {
      await deleteTenantPrivateMedia(tc.tenant.id, cv.id);
      return fail(t(rs.cvWrongType, lang), { cvMediaId: t(rs.cvWrongType, lang) });
    }
    // A media object may back exactly one application.
    const attached = await db.application.findFirst({ where: { tenantId: tc.tenant.id, cvMediaId: cv.id }, select: { id: true } });
    if (attached) return fail(t(rs.cvInvalid, lang), { cvMediaId: t(rs.cvInvalid, lang) });

    const jobTitle = t(job.title as LocalizedString, "en");

    // Duplicate guard: same phone applying to the same job within the window. Idempotent: refresh the CV, no new row.
    const since = new Date(Date.now() - APPLICATION_DUPLICATE_HOURS * 3_600_000);
    const dup = await db.application.findFirst({
      where: { tenantId: tc.tenant.id, jobId: job.id, phone, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, cvMediaId: true },
    });
    if (dup) {
      const oldCv = dup.cvMediaId;
      await db.application.update({ where: { id: dup.id }, data: { cvMediaId: cv.id, ...(d.coverLetter ? { coverLetter: d.coverLetter } : {}) } });
      if (oldCv && oldCv !== cv.id) await deleteTenantPrivateMedia(tc.tenant.id, oldCv);
      return success(t(rs.alreadyApplied, lang), { id: dup.id });
    }

    const app = await db.application.create({
      data: {
        tenantId: tc.tenant.id,
        jobId: job.id,
        name: d.name,
        phone,
        email: d.email || null,
        city: d.city || null,
        experience: d.experience || null,
        coverLetter: d.coverLetter || null,
        cvMediaId: cv.id,
        data: json({ jobTitle, jobSlug: job.slug, company: job.company, lang, ip }),
      },
    });
    void notifyNewLead(tc, {
      kind: "application",
      id: app.id,
      name: d.name,
      phone,
      email: d.email || null,
      city: d.city || null,
      experience: d.experience || null,
      coverLetter: d.coverLetter || null,
      jobTitle,
      company: job.company,
      location: job.location,
    });
    revalidatePath("/admin/applications");
    return success(t(rs.applied, lang), { id: app.id });
  } catch (e) {
    return publicFailure(lang, e);
  }
}

/* ───────────────────────── admin: jobs ───────────────────────── */

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null): Promise<string> {
  const root = slugify(base) || "job";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.job.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function upsertJob(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = jobSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const v = parsed.data;
    if (v.salaryMin != null && v.salaryMax != null && v.salaryMax < v.salaryMin) return fail("Please check the salary range.", { salaryMax: "Must be greater than minimum" });
    const slug = await uniqueSlug(ctx.tenant.id, v.slug || v.title.en, id);
    const data = {
      slug,
      title: json(sanitizeLocalized(v.title)),
      company: v.company || null,
      department: v.department || null,
      location: v.location,
      country: v.country,
      type: v.type,
      salaryMin: v.salaryMin,
      salaryMax: v.salaryMax,
      salaryText: v.salaryText || null,
      experience: v.experience || null,
      description: json(sanitizeLocalized(v.description)),
      requirements: json(sanitizeLocalized(v.requirements)),
      vacancies: v.vacancies,
      deadline: v.deadline ? new Date(v.deadline) : null,
      isFeatured: v.isFeatured,
      isActive: v.isActive,
    };
    let row;
    if (id) {
      const existing = await db.job.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.job.update({ where: { id }, data });
    } else {
      row = await db.job.create({ data: { ...data, tenantId: ctx.tenant.id } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "job.update" : "job.create", entity: "Job", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Job updated." : "Job posted.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteJob(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.job.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "job.delete", entity: "Job", entityId: id });
    revalidatePath("/", "layout");
    return success("Job deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleJob(id: string, field: "isActive" | "isFeatured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (field !== "isActive" && field !== "isFeatured") return fail("Invalid field.");
    if (typeof value !== "boolean") return fail("Invalid value.");
    const { count } = await db.job.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `job.${field}`, entity: "Job", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    if (field === "isActive") return success(value ? "Job is now live." : "Job hidden from website.");
    return success(value ? "Marked as featured." : "Removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ───────────────────────── admin: applications ───────────────────────── */

/**
 * Move an application through the hiring pipeline. Transitions are validated against
 * `canTransitionApplication` (forward any number of stages, back one stage, reject from any
 * non-hired stage, reopen a rejection). Notes may be saved without changing the status.
 */
export async function updateApplicationStatus(id: string, status: string, notes?: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = applicationStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const existing = await db.application.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { status: true } });
    if (!existing) return fail("Not found.");
    const from = existing.status as ApplicationStatusKey;
    if (!canTransitionApplication(from, s.data)) {
      const allowed = allowedApplicationTransitions(from);
      return fail(`Cannot move from ${from} to ${s.data}. Allowed: ${allowed.join(", ") || "none"}.`, { status: `Allowed: ${allowed.join(", ")}` });
    }
    await db.application.update({
      where: { id },
      data: { status: s.data, ...(notes !== undefined ? { notes: notes.slice(0, 2000) || null } : {}) },
    });
    if (from !== s.data) {
      await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "application.status", entity: "Application", entityId: id, meta: { from, to: s.data } });
    }
    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${id}`);
    return success(from === s.data ? "Notes saved." : `Moved to ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Delete an application and its private CV object (unless another application still references it). */
export async function deleteApplication(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const existing = await db.application.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { cvMediaId: true } });
    if (!existing) return fail("Not found.");
    await db.application.delete({ where: { id } });
    if (existing.cvMediaId) {
      const stillUsed = await db.application.count({ where: { tenantId: ctx.tenant.id, cvMediaId: existing.cvMediaId } });
      if (!stillUsed) await deleteTenantPrivateMedia(ctx.tenant.id, existing.cvMediaId);
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "application.delete", entity: "Application", entityId: id });
    revalidatePath("/admin/applications");
    return success("Application deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
