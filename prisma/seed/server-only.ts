/**
 * Stand-in for the `server-only` marker that Next.js aliases at build time. It is not a real npm
 * package, so app modules that start with `import "server-only"` (e.g. `src/server/auth/password.ts`)
 * cannot be loaded by plain Node/tsx. `tsconfig.seed.json` maps the specifier here so the seed can
 * reuse the app's own helpers (password hashing, settings builders) instead of duplicating them.
 * Nothing in here runs in the Next.js bundle.
 */
export {};
