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
