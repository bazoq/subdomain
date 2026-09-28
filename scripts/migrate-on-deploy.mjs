#!/usr/bin/env node
/**
 * Applies pending Prisma migrations (`prisma migrate deploy`) as the last step of `npm run build`,
 * but ONLY on a Vercel production deployment (VERCEL_ENV=production) or when MIGRATE_ON_BUILD=1.
 * Everywhere else (local builds, CI, Vercel preview deployments that share the production database)
 * it does nothing, so a preview branch can never change the production schema.
 *
 * - Runs after `next build` succeeded, so a broken build never touches the database.
 * - `migrate deploy` only applies migrations from prisma/migrations that are not yet recorded in
 *   `_prisma_migrations`; it never resets or drops data and is safe to run on every deploy.
 * - Needs DIRECT_URL (Supabase session pooler, port 5432): the transaction pooler (6543) cannot run
 *   migrations. A failure fails the build, so Vercel keeps serving the previous deployment.
 */
import { spawnSync } from "node:child_process";

const onVercelProduction = process.env.VERCEL_ENV === "production";
const forced = process.env.MIGRATE_ON_BUILD === "1";

if (!onVercelProduction && !forced) {
  console.log("[migrate-on-deploy] skipped (not a Vercel production deployment).");
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.error(
    "[migrate-on-deploy] DIRECT_URL is not set. Add Supabase's session pooler string (port 5432) to the\n" +
      "Vercel project's Production environment variables, then redeploy. See docs/DEPLOY.md.",
  );
  process.exit(1);
}

console.log("[migrate-on-deploy] applying pending migrations (prisma migrate deploy)…");
const res = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: process.platform === "win32" });
if (res.status !== 0) {
  console.error("[migrate-on-deploy] prisma migrate deploy failed; the deployment is aborted.");
  process.exit(res.status ?? 1);
}
console.log("[migrate-on-deploy] database schema is up to date.");
