import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendor output:
    "src/generated/**",
    "coverage/**",
  ]),
  {
    // Project rules. Kept at `warn` where the codebase still has occurrences so CI stays green
    // while they are cleaned up; `npm run lint` prints them.
    rules: {
      // Use the structured logger (`log` from `@/lib/log`) so Vercel log drains get JSON lines.
      "no-console": "warn",
      "prefer-const": "warn",
      eqeqeq: ["warn", "smart"],
      "no-var": "error",
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports", fixStyle: "inline-type-imports", disallowTypeAnnotations: false }],
      // OFF on purpose: the rule builds one regex per app route and turns the root-level catch-all
      // `src/app/(super)/(site)/[...rest]/page.tsx` into a pattern that matches EVERY internal href, so every
      // <a href="/..."> in the repo is reported. Tenant-host URLs also never correspond to route files (they are
      // rewritten to /_sites/[host]/...). The convention (use <Link> for internal navigation) is documented in
      // docs/CONVENTIONS.md and enforced in review instead.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    // The logger is the one sanctioned console transport.
    files: ["src/lib/log.ts"],
    rules: { "no-console": "off" },
  },
  {
    // Node scripts, the seed and tests talk to a terminal, not a log drain.
    files: ["scripts/**", "prisma/**", "tests/**", "**/*.test.ts", "*.config.*", "*.mjs"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
