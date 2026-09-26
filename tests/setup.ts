/**
 * Global test setup. Provides the environment variables that `src/config/env.ts` validates at
 * import time so any module that transitively imports it can load. Values are dummies — tests
 * must never open a real database connection (vitest already sets NODE_ENV=test).
 */
process.env.ROOT_DOMAIN ??= "example.test";
process.env.NEXT_PUBLIC_ROOT_DOMAIN ??= process.env.ROOT_DOMAIN;
process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:1/test";
process.env.SESSION_SECRET ??= "test-session-secret-that-is-at-least-32-characters-long";
