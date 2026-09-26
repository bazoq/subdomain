import "server-only";
import { z } from "zod";

/**
 * Validated server environment. Imported only from server code (`server-only` guards against a
 * client bundle ever pulling secrets in). Anything the browser needs is a separate NEXT_PUBLIC_*
 * variable read in `src/config/site.ts`.
 *
 * Production rules (NODE_ENV=production):
 *  - SESSION_SECRET: >= 32 chars, not a placeholder, reasonable entropy.
 *  - ROOT_DOMAIN must be a real domain (not localhost) and must equal NEXT_PUBLIC_ROOT_DOMAIN.
 *  - R2_* is all-or-nothing and R2_PUBLIC_URL must be https.
 * Failing validation throws at startup with every problem listed, never a partial boot.
 */

const isProdEnv = process.env.NODE_ENV === "production";

const hostname = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/, "must be a bare hostname (no scheme, port or path)");

const PLACEHOLDER_SECRET = /(change|replace|example|sample|secret|password|your[-_ ]?|xxx|1234|abcd|todo)/i;

function weakSecret(s: string): string | null {
  if (s.length < 32) return "must be at least 32 characters";
  if (PLACEHOLDER_SECRET.test(s)) return "looks like a placeholder — generate one with `openssl rand -base64 48`";
  if (new Set(s).size < 12) return "has too little variety (needs at least 12 distinct characters)";
  return null;
}

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),

    ROOT_DOMAIN: hostname.default("localhost"),
    NEXT_PUBLIC_ROOT_DOMAIN: hostname.optional(),

    DATABASE_URL: z.string().min(1, "is required").regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL"),
    DIRECT_URL: z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL").optional(),

    SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),

    R2_ACCOUNT_ID: z.string().regex(/^[a-f0-9]{32}$|^[a-z0-9]{8,64}$/i, "must be the Cloudflare account id").optional(),
    R2_ACCESS_KEY_ID: z.string().min(8).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(16).optional(),
    R2_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/, "must be a valid bucket name").optional(),
    R2_PUBLIC_URL: z.string().url().optional(),

    RESEND_API_KEY: z.string().optional(),
    NOTIFY_FROM_EMAIL: z.string().email().optional(),
  })
  .superRefine((e, ctx) => {
    const prod = e.NODE_ENV === "production";

    if (e.NEXT_PUBLIC_ROOT_DOMAIN && e.NEXT_PUBLIC_ROOT_DOMAIN !== e.ROOT_DOMAIN) {
      ctx.addIssue({ code: "custom", path: ["NEXT_PUBLIC_ROOT_DOMAIN"], message: `must equal ROOT_DOMAIN (${e.ROOT_DOMAIN})` });
    }

    if (prod) {
      if (e.ROOT_DOMAIN === "localhost" || e.ROOT_DOMAIN.endsWith(".localhost")) {
        ctx.addIssue({ code: "custom", path: ["ROOT_DOMAIN"], message: "must be the real platform domain in production" });
      }
      const weak = weakSecret(e.SESSION_SECRET);
      if (weak) ctx.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: weak });
    }

    const r2 = [e.R2_ACCOUNT_ID, e.R2_ACCESS_KEY_ID, e.R2_SECRET_ACCESS_KEY, e.R2_BUCKET, e.R2_PUBLIC_URL];
    const set = r2.filter(Boolean).length;
    if (set > 0 && set < r2.length) {
      ctx.addIssue({
        code: "custom",
        path: ["R2_ACCOUNT_ID"],
        message: "R2 is half-configured: set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (or none)",
      });
    }
    if (e.R2_PUBLIC_URL) {
      const u = new URL(e.R2_PUBLIC_URL);
      if (prod && u.protocol !== "https:") ctx.addIssue({ code: "custom", path: ["R2_PUBLIC_URL"], message: "must be https in production" });
      if (u.search || u.hash) ctx.addIssue({ code: "custom", path: ["R2_PUBLIC_URL"], message: "must not contain a query string or fragment" });
    }

    if (e.RESEND_API_KEY && !e.NOTIFY_FROM_EMAIL) {
      ctx.addIssue({ code: "custom", path: ["NOTIFY_FROM_EMAIL"], message: "is required when RESEND_API_KEY is set" });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`).join("\n");
  throw new Error(
    `Invalid environment variables${isProdEnv ? " (production rules apply)" : ""}:\n${issues}\n` +
      "See .env.example and docs/DEPLOY.md.",
  );
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isVercel = Boolean(env.VERCEL);
export const r2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_URL,
);
