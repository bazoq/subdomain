import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Unit-test runner. Tests live in `tests/**` (or colocated `*.test.ts`) and must never need a
 * database: modules that import `@/server/db` are mocked with `vi.mock`, and the Next-only
 * `server-only` marker is aliased to an empty module so server modules can be imported in Node.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
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
      include: ["src/lib/**", "src/templates/fields.ts", "src/templates/registry.ts", "src/proxy.ts", "src/server/rate-limit.ts", "src/server/site-content.ts", "src/app/api/health/**", "scripts/**"],
    },
  },
});
