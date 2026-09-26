/** Shared constants for the recruiting module (safe to import from client and server). */

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Overseas"] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Common destination countries for Pakistani recruiting agencies. */
export const JOB_COUNTRIES = ["Pakistan", "Saudi Arabia", "UAE", "Qatar", "Oman", "Kuwait", "Bahrain", "Malaysia", "UK"] as const;

export const EXPERIENCE_LEVELS = ["Fresh", "1-2 years", "3-5 years", "5-10 years", "10+ years"] as const;

export const APPLICATION_STATUSES = ["RECEIVED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"] as const;
export type ApplicationStatusKey = (typeof APPLICATION_STATUSES)[number];

/** Linear hiring pipeline (REJECTED sits outside it). */
export const APPLICATION_PIPELINE: ApplicationStatusKey[] = ["RECEIVED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];

/**
 * Application status state machine:
 *  - forward to any later pipeline stage (recruiters may skip steps),
 *  - backward by exactly one stage (undo),
 *  - REJECTED from any non-hired stage; REJECTED can be reopened to RECEIVED/SHORTLISTED,
 *  - HIRED is terminal except undo to OFFERED.
 */
export function canTransitionApplication(from: ApplicationStatusKey, to: ApplicationStatusKey): boolean {
  if (from === to) return true;
  if (from === "REJECTED") return to === "RECEIVED" || to === "SHORTLISTED";
  if (from === "HIRED") return to === "OFFERED";
  if (to === "REJECTED") return true;
  const a = APPLICATION_PIPELINE.indexOf(from);
  const b = APPLICATION_PIPELINE.indexOf(to);
  if (a < 0 || b < 0) return false;
  return b > a || b === a - 1;
}

export function allowedApplicationTransitions(from: ApplicationStatusKey): ApplicationStatusKey[] {
  return APPLICATION_STATUSES.filter((s) => s !== from && canTransitionApplication(from, s));
}

/** Jobs posted within this many days get a "New" badge. */
export const NEW_JOB_DAYS = 7;

export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_MIME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
export const CV_FOLDER = "cv";

export const JOBS_PAGE_SIZE = 12;

/** Same phone applying to the same job within this window is treated as a duplicate (idempotent). */
export const APPLICATION_DUPLICATE_HOURS = 24;
