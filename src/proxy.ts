import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based multi-tenant routing + per-request security headers.
 *
 *  ROOT_DOMAIN (and www.) -> super website + /super admin (served from app/(super))
 *  *.vercel.app           -> super website (preview deployments)
 *  any other host         -> tenant site, rewritten to app/_sites/[host]/...
 *
 * Security posture of this file:
 *  - The request host is validated (RFC 1123 labels, optional port, IPv6 literal) and lowercased.
 *    Anything else is answered with 400 so a hostile `Host` never reaches the router or the DB.
 *  - `x-forwarded-host` is only trusted on Vercel, where the edge network sets it; elsewhere a
 *    client could forge it to impersonate another tenant.
 *  - Inbound `x-tenant-host`, `x-request-host` and `x-nonce` are stripped and re-set here, so
 *    server code can trust them.
 *  - `/_sites/**` (internal route group) and `/super/**` on tenant hosts are blocked, after
 *    percent-decoding and slash normalisation so `/%5Fsites` or `//_sites` cannot slip through.
 *  - A per-request nonce is generated and a strict CSP is sent in *report-only* mode
 *    (the enforced, pragmatic CSP lives in next.config.ts). Next.js reads the nonce from the
 *    request header and stamps it on every framework script, so once the report endpoint is
 *    quiet the report-only policy can be promoted to enforced.
 *
 * Nothing here touches the database: proxy must stay cheap. Runs in the Node.js runtime.
 */

const ROOT = (process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();
const ON_VERCEL = Boolean(process.env.VERCEL);
const IS_DEV = process.env.NODE_ENV !== "production";
const R2_ACCOUNT = (process.env.R2_ACCOUNT_ID ?? "").replace(/[^a-z0-9]/gi, "");

/** RFC 1123 hostname: labels of letters/digits/hyphen, 1-63 chars, no leading/trailing hyphen. Punycode (xn--) is plain ASCII and passes. */
const HOSTNAME_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const IPV6_RE = /^[0-9a-f:.]{2,45}$/;

/**
 * Parse a `Host`-style header into a canonical hostname (lowercase, no port, no trailing dot).
 * Returns null for anything malformed: multiple values, whitespace, control chars, bad port,
 * non-ASCII, over-long names.
 */
function parseHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = raw.trim().toLowerCase();
  if (h.length === 0 || h.length > 260) return null;
  if (/[\s,\\/@?#%]/.test(h)) return null; // header injection / list / URL fragments
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    if (end < 0) return null;
    const rest = h.slice(end + 1);
    if (rest && !/^:\d{1,5}$/.test(rest)) return null;
    const ip = h.slice(1, end);
    return IPV6_RE.test(ip) ? ip : null;
  }
  const colon = h.lastIndexOf(":");
  if (colon >= 0) {
    if (!/^\d{1,5}$/.test(h.slice(colon + 1))) return null;
    h = h.slice(0, colon);
  }
  h = h.replace(/\.$/, "");
  if (!h || h.length > 253) return null;
  return HOSTNAME_RE.test(h) ? h : null;
}

function requestHost(req: NextRequest): string | null {
  // Vercel's edge sets x-forwarded-host from the client's Host; anywhere else it is client-controlled.
  const forwarded = ON_VERCEL ? parseHost(req.headers.get("x-forwarded-host")) : null;
  return forwarded ?? parseHost(req.headers.get("host"));
}

function isRootHost(host: string) {
  if (host === ROOT || host === `www.${ROOT}`) return true;
  // Vercel preview deployments render the super site.
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

/** Percent-decode and normalise a path so prefix checks cannot be bypassed with encoding tricks. */
function normalisePath(pathname: string): string | null {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    return null;
  }
  p = p.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(p)) return null;
  return p.toLowerCase();
}

function isInternalPath(p: string) {
  return /^\/_sites(?:\/|$)/.test(p);
}

function nonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Strict CSP (report-only for now). Keep in sync with the enforced policy in next.config.ts. */
function strictCsp(n: string, opts: { admin: boolean }) {
  const r2 = R2_ACCOUNT ? ` https://${R2_ACCOUNT}.r2.cloudflarestorage.com` : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${n}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    // Templates theme via inline style attributes; nonces do not cover style attributes.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' blob: https:",
    `connect-src 'self'${r2}${IS_DEV ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://maps.google.com",
    opts.admin ? "frame-ancestors 'none'" : "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

function bad(status: number, text: string) {
  return new NextResponse(text, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export function proxy(req: NextRequest) {
  const host = requestHost(req);
  if (!host) return bad(400, "Invalid host");

  const path = normalisePath(req.nextUrl.pathname);
  if (path === null) return bad(400, "Invalid path");

  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = path.startsWith("/admin") || path.startsWith("/super");

  // Never trust routing/security headers from the client.
  const headers = new Headers(req.headers);
  headers.delete("x-tenant-host");
  headers.delete("x-request-host");
  headers.delete("x-nonce");
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.set("x-request-host", host);

  const n = nonce();
  const csp = strictCsp(n, { admin: isAdmin });
  if (!isApi) {
    headers.set("x-nonce", n);
    // Next.js extracts the nonce from this request header and applies it to its own scripts.
    headers.set("content-security-policy-report-only", csp);
  }

  const decorate = (res: NextResponse) => {
    if (!isApi) res.headers.set("content-security-policy-report-only", csp);
    return res;
  };

  if (isRootHost(host)) {
    // Never allow direct access to the internal tenant route group from the root host.
    if (isInternalPath(path)) return bad(404, "Not found");
    return decorate(NextResponse.next({ request: { headers } }));
  }

  // Tenant host: block direct internal access and rewrite everything else.
  if (isInternalPath(path) || /^\/super(?:\/|$)/.test(path)) return bad(404, "Not found");

  headers.set("x-tenant-host", host);

  // API routes are shared by all hosts; they read the tenant from x-tenant-host.
  if (isApi) return NextResponse.next({ request: { headers } });

  const url = req.nextUrl.clone();
  url.pathname = `/_sites/${host}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return decorate(NextResponse.rewrite(url, { request: { headers } }));
}

export const config = {
  matcher: [
    // Skip Next internals, static assets and image optimisation. NB: inside a string the dot must be
    // written `\\.` — a single backslash collapses and `.*.(css|js|txt)$` would match `/roadmap`.
    // robots.txt / sitemap.xml / manifest are NOT excluded: tenant hosts must be able to serve their own.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|otf|css|js|map)$).*)",
  ],
};
