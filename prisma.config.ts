import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (non-pooled) connection for migrations; falls back to the runtime URL.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
