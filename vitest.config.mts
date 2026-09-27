import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit-test runner. Tests live in `tests/**` (or colocated `*.test.ts`) and must never need a
 * database: modules that import `@/server/db` are mocked with `vi.mock`, and the Next-only
 * `server-only` marker is aliased to an empty module so server modules can be imported in Node.
 *
 * `resolve.tsconfigPaths` (Vite 8+) resolves the `@/*` alias from tsconfig.json natively — the former
 * `vite-tsconfig-paths` plugin is no longer needed.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: [
        "src/lib/**",
        "src/templates/fields.ts",
        "src/templates/registry.ts",
        "src/templates/theme.ts",
        "src/proxy.ts",
        "src/server/rate-limit.ts",
        "src/server/site-content.ts",
        "src/server/site-seo.ts",
        "src/server/site.ts",
        "src/modules/shared/module-gate.ts",
        "src/app/api/health/**",
        "scripts/**",
      ],
    },
  },
});
