import "server-only";
import { env } from "@/config/env";
import { brand } from "@/config/brand";
import type { TenantContext } from "@/server/tenant";
import { formatPKR, normalizePkPhone, whatsappLink } from "@/lib/utils";
import { errorFields, log } from "@/lib/log";

/**
 * Best-effort notifications to the tenant owner.
 *  - Email via the Resend HTTP API (no SDK). Silently a no-op without RESEND_API_KEY.
 *  - WhatsApp deep links (wa.me) for the owner's number so staff can reply in one tap.
 * Nothing in this module ever throws into a user-facing flow: every entry point
 * resolves to `false` on failure and emits a structured log line.
 */

const EMAIL_TIMEOUT_MS = 8_000;
const SUBJECT_MAX = 200;

/**
 * Subjects contain visitor-controlled text (names, package titles). Collapse CR/LF and other
 * control characters so a crafted name cannot inject extra headers or break the subject line.
 */
export function safeSubject(subject: string): string {
  return subject
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ") // \s also covers U+2028/U+2029 line separators
    .trim()
    .slice(0, SUBJECT_MAX);
}

export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !to || !isEmail(to)) return false;
  const cleanSubject = safeSubject(subject) || "(no subject)";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.NOTIFY_FROM_EMAIL ?? `${brand.name} <no-reply@${env.ROOT_DOMAIN}>`,
        to: [to],
        subject: cleanSubject,
        text,
        html: html ?? textToHtml(text),
      }),
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });
    if (!res.ok) log.warn("notify.email_rejected", { status: res.status, subject: cleanSubject.slice(0, 60) });
    return res.ok;
  } catch (err) {
    log.error("notify.email_failed", errorFields(err));
    return false;
  }
}

/** Email the tenant's notification address (Settings > Notifications, falling back to the contact email). */
export async function notifyTenant(tc: TenantContext, msg: { subject: string; text: string; html?: string }): Promise<boolean> {
  try {
    const to = tc.settings.notifications.emailTo || tc.settings.contact.email;
    if (!to) return false;
    return await sendEmail(to, `[${tc.tenant.name}] ${msg.subject}`, msg.text, msg.html);
  } catch (err) {
    log.error("notify.tenant_failed", { tenantId: tc.tenant.id, ...errorFields(err) });
    return false;
  }
}

/* ───────────────────────── WhatsApp ───────────────────────── */

/** The owner's WhatsApp number in E.164 digits, or null when none is configured / valid. */
export function tenantWhatsAppNumber(tc: TenantContext): string | null {
  const raw = tc.settings.notifications.whatsappTo || tc.settings.contact.whatsapp || tc.settings.contact.phone;
  if (!raw) return null;
  return normalizePkPhone(raw) ?? (raw.replace(/[^\d]/g, "").length >= 7 ? raw.replace(/[^\d]/g, "") : null);
}

/** `https://wa.me/<owner>?text=…` for the tenant owner, or null. */
export function tenantWhatsAppLink(tc: TenantContext, text: string): string | null {
  const n = tenantWhatsAppNumber(tc);
  return n ? whatsappLink(n, text) : null;
}

/** `https://wa.me/<visitor>?text=…` so staff can reply to a lead; null when the visitor phone is unusable. */
export function replyWhatsAppLink(visitorPhone: string | null | undefined, text: string): string | null {
  if (!visitorPhone) return null;
  const n = normalizePkPhone(visitorPhone) ?? visitorPhone.replace(/[^\d]/g, "");
  return n.length >= 7 ? whatsappLink(n, text) : null;
}

/* ───────────────────────── templates ───────────────────────── */

export type LeadNotification =
  | { kind: "application"; id: string; name: string; phone: string; email?: string | null; city?: string | null; experience?: string | null; coverLetter?: string | null; jobTitle: string; company?: string | null; location?: string }
  | { kind: "booking"; id: string; name: string; phone: string; email?: string | null; packageTitle: string; destination: string; pricePerPerson: number; travellers: number; date?: string | null; message?: string | null }
  | { kind: "lead"; id: string; formKey: string; name: string; phone?: string | null; email?: string | null; subject?: string | null; message?: string | null; fields?: Record<string, string>; fileCount?: number };

const FORM_LABELS: Record<string, string> = {
  contact: "Contact message",
  quote: "Quote request",
  consultation: "Consultation request",
  property_inquiry: "Property inquiry",
  employer_request: "Employer / manpower request",
  gym_trial: "Free-trial request",
  custom_cake: "Custom cake order",
};

export function formLabel(formKey: string): string {
  return FORM_LABELS[formKey] ?? formKey.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function adminUrl(tc: TenantContext, path: string): string {
  const proto = tc.host.endsWith("localhost") || tc.host.includes("localhost:") ? "http" : "https";
  return `${proto}://${tc.host}${path}`;
}

function line(label: string, value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  return `${label}: ${value}`;
}

/** Subject + text body for each lead type. Kept plain so it renders in any mail client / WhatsApp. */
export function buildNotification(tc: TenantContext, n: LeadNotification): { subject: string; text: string; whatsappReply: string | null } {
  const lines: (string | null)[] = [];
  let subject = "";
  let reply = "";
  let adminPath = "/admin/leads";

  if (n.kind === "application") {
    subject = `New application: ${n.jobTitle} — ${n.name}`;
    adminPath = `/admin/applications/${n.id}`;
    lines.push(
      line("Candidate", n.name),
      line("Phone", n.phone),
      line("Email", n.email),
      line("City", n.city),
      line("Experience", n.experience),
      line("Job", `${n.jobTitle}${n.company ? ` · ${n.company}` : ""}${n.location ? ` · ${n.location}` : ""}`),
      n.coverLetter ? `\n${n.coverLetter}` : null,
    );
    reply = `Assalam o Alaikum ${n.name}, this is ${tc.tenant.name}. We received your application for "${n.jobTitle}".`;
  } else if (n.kind === "booking") {
    subject = `New booking request: ${n.packageTitle} — ${n.name}`;
    adminPath = "/admin/bookings";
    const total = n.pricePerPerson > 0 ? formatPKR(n.pricePerPerson * n.travellers) : null;
    lines.push(
      line("Traveller", n.name),
      line("Phone", n.phone),
      line("Email", n.email),
      line("Package", `${n.packageTitle} · ${n.destination}`),
      line("Travellers", n.travellers),
      line("Preferred date", n.date || "flexible"),
      line("Price per person", n.pricePerPerson > 0 ? formatPKR(n.pricePerPerson) : "on request"),
      line("Estimated total", total),
      n.message ? `\n${n.message}` : null,
    );
    reply = `Assalam o Alaikum ${n.name}, this is ${tc.tenant.name} regarding your booking request for "${n.packageTitle}".`;
  } else {
    subject = `${formLabel(n.formKey)} from ${n.name}`;
    adminPath = `/admin/leads/${n.id}`;
    lines.push(line("Name", n.name), line("Phone", n.phone), line("Email", n.email), line("Subject", n.subject));
    for (const [k, v] of Object.entries(n.fields ?? {})) lines.push(line(k.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase()), v));
    if (n.fileCount) lines.push(line("Attached files", n.fileCount));
    if (n.message) lines.push(`\n${n.message}`);
    reply = `Assalam o Alaikum ${n.name}, this is ${tc.tenant.name}. Thank you for contacting us.`;
  }

  const phone = "phone" in n ? n.phone : null;
  const whatsappReply = replyWhatsAppLink(phone, reply);
  const text = [...lines.filter((l): l is string => !!l), "", `Open in admin: ${adminUrl(tc, adminPath)}`, whatsappReply ? `Reply on WhatsApp: ${whatsappReply}` : null]
    .filter((l): l is string => l !== null)
    .join("\n");
  return { subject, text, whatsappReply };
}

/** Fire-and-forget owner notification for a new lead/application/booking. Never throws. */
export async function notifyNewLead(tc: TenantContext, n: LeadNotification): Promise<boolean> {
  try {
    const built = buildNotification(tc, n);
    return await notifyTenant(tc, { subject: built.subject, text: built.text });
  } catch (err) {
    log.error("notify.new_lead_failed", { tenantId: tc.tenant.id, kind: n.kind, ...errorFields(err) });
    return false;
  }
}

/* ───────────────────────── helpers ───────────────────────── */

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function textToHtml(text: string) {
  const escaped = escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}">${u}</a>`);
  return `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.5">${escaped}</pre>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
