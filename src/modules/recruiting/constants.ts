/** Shared constants for the recruiting module (safe to import from client and server). */

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Overseas"] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Common destination countries for Pakistani recruiting agencies. */
export const JOB_COUNTRIES = ["Pakistan", "Saudi Arabia", "UAE", "Qatar", "Oman", "Kuwait", "Bahrain", "Malaysia", "UK"] as const;

export const EXPERIENCE_LEVELS = ["Fresh", "1-2 years", "3-5 years", "5-10 years", "10+ years"] as const;

export const APPLICATION_STATUSES = ["RECEIVED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"] as const;
export type ApplicationStatusKey = (typeof APPLICATION_STATUSES)[number];

/** Jobs posted within this many days get a "New" badge. */
export const NEW_JOB_DAYS = 7;

export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_FOLDER = "cv";

export const JOBS_PAGE_SIZE = 12;
