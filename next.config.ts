import type { NextConfig } from "next";

/**
 * Security headers. Everything here is static (no per-request state); the per-request nonce
 * and the strict report-only CSP are produced by `src/proxy.ts`. Keep the two policies in sync.
 */
const isDev = process.env.NODE_ENV !== "production";
const rootDomain = (process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();
const r2Account = (process.env.R2_ACCOUNT_ID ?? "").replace(/[^a-z0-9]/gi, "");

/** Origins of the platform itself — allowed to frame tenant sites (super-admin previews). */
const platformOrigins =
  rootDomain === "localhost" ? "http://localhost:* http://*.localhost:*" : `https://${rootDomain} https://*.${rootDomain}`;

/**
 * Enforced, pragmatic CSP. `'unsafe-inline'` for scripts is still required because static
 * pages (404, error boundaries) cannot carry a per-request nonce; the strict nonce policy runs in
 * report-only mode from proxy.ts and reports to /api/csp-report. Everything else is locked down:
 * no plugins, no foreign form targets, no <base> hijack, framing only by ourselves.
 */
function csp(opts: { frameAncestors: string }) {
  const r2Api = r2Account ? ` https://${r2Account}.r2.cloudflarestorage.com` : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Uploaded images are served from the platform root (`/media/*`); in dev that is http://localhost:3000.
    `img-src 'self' data: blob: https:${isDev ? " http://localhost:*" : ""}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' blob: https:",
    // Browser uploads PUT straight to R2 with a presigned URL.
    `connect-src 'self'${r2Api}${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://maps.google.com",
    `frame-ancestors ${opts.frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp({ frameAncestors: `'self' ${platformOrigins}` }) },
  // HSTS only makes sense over TLS; sending it in dev would poison localhost for other projects.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

/** Admin surfaces: never framed, never indexed, isolated browsing context group. */
const adminHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: csp({ frameAncestors: "'none'" }) },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * `typedRoutes` is stable in Next 16 but OFF here on purpose: trialled 2026-09-27, it produced 343 type errors
   * (template nav/`href` props are plain strings). Turn it on once `Link`/`href` usages are migrated to `Route`.
   * `serverExternalPackages` is not needed: `pg`, `@prisma/client` and `@aws-sdk/client-s3` are already in
   * Next's built-in external list; `bcryptjs` and `jose` are pure JS.
   */
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      // `/media/*` (uploaded files) sets its own sandboxing headers in its route handler.
      { source: "/((?!media/).*)", headers: baseHeaders },
      { source: "/admin", headers: adminHeaders },
      { source: "/admin/:path*", headers: adminHeaders },
      { source: "/super", headers: adminHeaders },
      { source: "/super/:path*", headers: adminHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
