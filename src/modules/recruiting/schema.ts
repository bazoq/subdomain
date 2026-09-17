import { z } from "zod";
import { localizedString } from "@/lib/i18n";
import { APPLICATION_STATUSES } from "./constants";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const requiredLocalized = localizedString.refine((v) => v.en.trim().length > 0, { message: "Title is required", path: ["en"] });

/** Admin job editor payload (JSON server action). */
export const jobSchema = z.object({
  title: requiredLocalized,
  slug: z.string().trim().max(80).default(""),
  company: z.string().trim().max(120).default(""),
  department: z.string().trim().max(80).default(""),
  location: z.string().trim().min(2, "Location is required").max(120),
  country: z.string().trim().min(2, "Country is required").max(60).default("Pakistan"),
  type: z.string().trim().min(2, "Job type is required").max(40).default("Full-time"),
  salaryMin: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  salaryMax: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  salaryText: z.string().trim().max(120).default(""),
  experience: z.string().trim().max(60).default(""),
  description: localizedString.default({ en: "" }),
  requirements: localizedString.default({ en: "" }),
  vacancies: z.number().int().min(1).max(9999).default(1),
  deadline: z.union([z.literal(""), z.string().regex(isoDate, "Invalid date")]).default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type JobFormValue = z.output<typeof jobSchema>;

export const emptyJob: JobFormValue = {
  title: { en: "" },
  slug: "",
  company: "",
  department: "",
  location: "",
  country: "Pakistan",
  type: "Full-time",
  salaryMin: null,
  salaryMax: null,
  salaryText: "",
  experience: "",
  description: { en: "" },
  requirements: { en: "" },
  vacancies: 1,
  deadline: "",
  isFeatured: false,
  isActive: true,
};

/** Public application payload. */
export const applySchema = z.object({
  jobId: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  email: z.string().trim().email("Invalid email").max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  experience: z.string().trim().max(60).optional().or(z.literal("")),
  coverLetter: z.string().trim().max(3000).optional().or(z.literal("")),
  cvMediaId: z.string().trim().min(1, "Please upload your CV").max(40),
  website: z.string().max(0).optional(), // honeypot
});
export type ApplyInput = z.input<typeof applySchema>;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
