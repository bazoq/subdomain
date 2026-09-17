import type { Job } from "@/generated/prisma/client";
import { formatPKR } from "@/lib/utils";
import { NEW_JOB_DAYS } from "./constants";

/** UTC midnight of today — jobs whose deadline is before this are expired. */
export function startOfToday(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

export function isJobExpired(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return d.getTime() < startOfToday().getTime();
}

export function isNewJob(createdAt: Date | string): boolean {
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Date.now() - d.getTime() < NEW_JOB_DAYS * 86_400_000;
}

/** Human salary line: explicit text wins, then min–max, then open-ended. Null when nothing is set. */
export function jobSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "salaryText">): string | null {
  if (job.salaryText) return job.salaryText;
  if (job.salaryMin != null && job.salaryMax != null) return `${formatPKR(job.salaryMin)} – ${formatPKR(job.salaryMax)}`;
  if (job.salaryMin != null) return `From ${formatPKR(job.salaryMin)}`;
  if (job.salaryMax != null) return `Up to ${formatPKR(job.salaryMax)}`;
  return null;
}

/** "Riyadh, Saudi Arabia" — omits the country for local jobs. */
export function jobPlace(job: Pick<Job, "location" | "country">): string {
  if (!job.country || job.country === "Pakistan") return job.location;
  return job.location.toLowerCase().includes(job.country.toLowerCase()) ? job.location : `${job.location}, ${job.country}`;
}

/** Build a /jobs URL from filter values, omitting empties. */
export function jobsHref(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (k === "page" && Number(v) <= 1)) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `/jobs?${s}` : "/jobs";
}
