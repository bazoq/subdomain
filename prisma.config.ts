import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 configuration (replaces `url` in schema.prisma and the package.json "prisma" block).
 *
 * - CLI commands (migrate, db seed, studio) use DIRECT_URL — Supabase's session/direct connection
 *   (port 5432). Migrations need DDL and advisory locks that the transaction pooler does not support.
 *   Falls back to DATABASE_URL for local setups with a single URL.
 * - The runtime client (src/server/db.ts) does NOT read this file; it connects with DATABASE_URL
 *   (transaction pooler, port 6543) through @prisma/adapter-pg.
 * - The seed runs through tsx with `tsconfig.seed.json`, which shims Next's `server-only` marker so the
 *   seed can reuse app helpers (password hashing, tenant provisioning).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --tsconfig tsconfig.seed.json prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
