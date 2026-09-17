"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant } from "@/server/notify";
import { normalizePkPhone, slugify } from "@/lib/utils";
import { t, type LocalizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { applySchema, applicationStatusSchema, jobSchema } from "./schema";
import { rs } from "./strings";
import { isJobExpired } from "./helpers";

/* ───────────────────────── public ───────────────────────── */

/** Visitor applies to a job. JSON input from the ApplyForm client component. */
export async function applyToJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(t(rs.applied, lang)); // honeypot: pretend success

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `apply:${ip}`, limit: 5, windowSec: 3600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many applications from this connection. Please try again later.");

  const job = await db.job.findFirst({ where: { id: d.jobId, tenantId: tc.tenant.id, isActive: true } });
  if (!job) return fail("This job is no longer available.");
  if (isJobExpired(job.deadline)) return fail("Applications for this job are closed.");

  const cv = await db.media.findFirst({
    where: { id: d.cvMediaId, tenantId: tc.tenant.id, visibility: "PRIVATE", confirmed: true },
    select: { id: true },
  });
  if (!cv) return fail("CV upload failed. Please upload your CV again.", { cvMediaId: "Please upload your CV again." });

  const phone = normalizePkPhone(d.phone) ?? d.phone;
  const jobTitle = t(job.title as LocalizedString, "en");
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
  notifyTenant(tc, {
    subject: `New application: ${jobTitle} — ${d.name}`,
    text: `${d.name} (${phone})${d.email ? ` · ${d.email}` : ""}${d.city ? ` · ${d.city}` : ""}\nExperience: ${d.experience || "—"}\n\n${d.coverLetter || ""}\n\nOpen admin: /admin/applications/${app.id}`,
  }).catch(() => undefined);
  return success(t(rs.applied, lang), { id: app.id });
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
      title: json(v.title),
      company: v.company || null,
      department: v.department || null,
      location: v.location,
      country: v.country,
      type: v.type,
      salaryMin: v.salaryMin,
      salaryMax: v.salaryMax,
      salaryText: v.salaryText || null,
      experience: v.experience || null,
      description: json(v.description),
      requirements: json(v.requirements),
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

export async function updateApplicationStatus(id: string, status: string, notes?: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = applicationStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const { count } = await db.application.updateMany({
      where: { id, tenantId: ctx.tenant.id },
      data: { status: s.data, ...(notes !== undefined ? { notes: notes.slice(0, 2000) || null } : {}) },
    });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "application.status", entity: "Application", entityId: id, meta: { status: s.data } });
    return success("Application updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.application.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "application.delete", entity: "Application", entityId: id });
    revalidatePath("/admin/applications");
    return success("Application deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
