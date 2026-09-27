/**
 * Values safe to use on the client. ROOT_DOMAIN is mirrored as NEXT_PUBLIC_ROOT_DOMAIN.
 */
export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();

export const DEV_PORT = 3000;

/** Build an absolute URL for a tenant host (adds port in development). */
export function hostUrl(host: string, path = "/") {
  const isLocal = host === "localhost" || host.endsWith(".localhost");
  const proto = isLocal ? "http" : "https";
  const port = isLocal ? `:${DEV_PORT}` : "";
  return `${proto}://${host}${port}${path.startsWith("/") ? path : `/${path}`}`;
}

export function rootUrl(path = "/") {
  return hostUrl(ROOT_DOMAIN, path);
}

/** Subdomain under the platform root, e.g. demo-pizza-01 -> demo-pizza-01.siteforge.pk */
export function subdomainHost(sub: string) {
  return `${sub}.${ROOT_DOMAIN}`;
}

/** True when the platform itself runs on localhost (dev). */
export const IS_LOCAL_ROOT = ROOT_DOMAIN === "localhost" || ROOT_DOMAIN.endsWith(".localhost");

/**
 * Canonical absolute origin of the marketing site (no trailing slash). Used for `metadataBase`,
 * canonical URLs, sitemaps and JSON-LD. Override with NEXT_PUBLIC_SITE_URL if the canonical host
 * differs from ROOT_DOMAIN (e.g. `https://www.siteforge.pk`).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? rootUrl("/")).replace(/\/+$/, "");

/** Absolute URL on the marketing site: absoluteUrl("/pricing") -> https://siteforge.pk/pricing */
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * True for the platform's own hosts: ROOT_DOMAIN, www.ROOT_DOMAIN and Vercel preview deployments.
 * Mirrors `isRootHost` in proxy.ts (kept separate so client-safe config never imports next/server).
 */
export function isPlatformHost(host: string | null | undefined, root: string = ROOT_DOMAIN): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0].replace(/\.$/, "");
  return h === root || h === `www.${root}` || h.endsWith(".vercel.app");
}

/** Demo tenants live on demo-<templateId>.ROOT_DOMAIN and must never be indexed. */
export function isDemoHost(host: string, root: string = ROOT_DOMAIN): boolean {
  const h = host.toLowerCase().split(":")[0];
  return h.startsWith("demo-") && h.endsWith(`.${root}`);
}
