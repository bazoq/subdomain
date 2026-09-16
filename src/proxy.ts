import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based multi-tenant routing.
 *
 *  ROOT_DOMAIN (and www.) -> super website + /super admin (served from app/(super))
 *  any other host         -> tenant site, rewritten to app/_sites/[host]/...
 *
 * The tenant host is also forwarded as `x-tenant-host` so server code never has to
 * re-derive it. Nothing here touches the database: proxy must stay cheap.
 */
const ROOT = (process.env.ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();

function normaliseHost(raw: string | null): string {
  if (!raw) return "";
  return raw.split(":")[0].toLowerCase().replace(/\.$/, "");
}

function isRootHost(host: string) {
  if (host === ROOT || host === `www.${ROOT}`) return true;
  // Vercel preview deployments render the super site.
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

export function proxy(req: NextRequest) {
  const host = normaliseHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  const { pathname, search } = req.nextUrl;

  const headers = new Headers(req.headers);
  headers.set("x-request-host", host);

  if (isRootHost(host)) {
    // Never allow direct access to the internal tenant route group from the root host.
    if (pathname.startsWith("/_sites")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next({ request: { headers } });
  }

  // Tenant host: block direct internal access and rewrite everything else.
  if (pathname.startsWith("/_sites") || pathname.startsWith("/super")) {
    return new NextResponse("Not found", { status: 404 });
  }

  headers.set("x-tenant-host", host);

  // API routes are shared by all hosts; they read the tenant from x-tenant-host.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers } });
  }

  const url = req.nextUrl.clone();
  url.pathname = `/_sites/${host}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    // Skip Next internals, static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|css|js|map|txt)$).*)",
  ],
};
