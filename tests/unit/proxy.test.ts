import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isRootHost, normaliseHost, normalisePath, resolveRewrite } from "@/proxy";

/**
 * Host-based routing in src/proxy.ts.
 *
 * The pure helpers (`normaliseHost`, `isRootHost`, `normalisePath`, `resolveRewrite`) are tested directly
 * with an explicit `root`. The request-level `proxy(req)` reads ROOT_DOMAIN / VERCEL at module load, so it is
 * imported after the env is stubbed and re-imported (fresh module) for the Vercel-specific behaviour.
 */
type ProxyModule = typeof import("@/proxy");
let proxy: ProxyModule["proxy"];

const ROOT = "example.pk";

function req(host: string, path = "/", extraHeaders: Record<string, string> = {}) {
  return new NextRequest(`https://internal.invalid${path}`, { headers: { host, ...extraHeaders } });
}

beforeAll(async () => {
  vi.stubEnv("ROOT_DOMAIN", "Example.PK");
  vi.stubEnv("VERCEL", "");
  vi.resetModules();
  ({ proxy } = await import("@/proxy"));
});
afterAll(() => vi.unstubAllEnvs());

describe("normaliseHost", () => {
  it("lowercases and strips port and trailing dot", () => {
    expect(normaliseHost("Shop.Example.PK.:443")).toBe("shop.example.pk");
    expect(normaliseHost("localhost:3000")).toBe("localhost");
    expect(normaliseHost("  pizza.example.pk ")).toBe("pizza.example.pk");
    expect(normaliseHost("xn--mgbh0fb.example.pk")).toBe("xn--mgbh0fb.example.pk");
  });

  it("accepts bracketed IPv6 literals with an optional port", () => {
    expect(normaliseHost("[::1]:3000")).toBe("::1");
    expect(normaliseHost("[2001:db8::1]")).toBe("2001:db8::1");
    expect(normaliseHost("[::1")).toBeNull();
    expect(normaliseHost("[::1]x")).toBeNull();
  });

  it("rejects malformed, hostile or over-long values", () => {
    for (const bad of [
      null,
      undefined,
      "",
      "a b.example.pk",
      "a.example.pk,b.example.pk",
      "example.pk/admin",
      "user@example.pk",
      "example.pk?x=1",
      "example.pk#frag",
      "example.pk%2e",
      "example.pk:abc",
      "example.pk:123456",
      "-bad.example.pk",
      "bad-.example.pk",
      "ünïcode.example.pk",
      `${"a".repeat(64)}.example.pk`,
      `${"a.".repeat(130)}pk`,
      "evil\r\nx-injected: 1",
    ]) {
      expect(normaliseHost(bad), String(bad)).toBeNull();
    }
  });
});

describe("isRootHost", () => {
  it("matches the root, www and Vercel preview hosts only", () => {
    expect(isRootHost("example.pk", ROOT)).toBe(true);
    expect(isRootHost("www.example.pk", ROOT)).toBe(true);
    expect(isRootHost("my-app-git-main-team.vercel.app", ROOT)).toBe(true);
    expect(isRootHost("pizza.example.pk", ROOT)).toBe(false);
    expect(isRootHost("example.pk.evil.com", ROOT)).toBe(false);
    expect(isRootHost("notexample.pk", ROOT)).toBe(false);
    expect(isRootHost("vercel.app.evil.com", ROOT)).toBe(false);
  });
});

describe("normalisePath", () => {
  it("percent-decodes, collapses slashes and lowercases so prefix checks cannot be bypassed", () => {
    expect(normalisePath("/%5Fsites/x")).toBe("/_sites/x");
    expect(normalisePath("//_sites//x")).toBe("/_sites/x");
    expect(normalisePath("\\_sites\\x")).toBe("/_sites/x");
    expect(normalisePath("/SUPER/Login")).toBe("/super/login");
  });

  it("returns null for undecodable or control-character paths", () => {
    expect(normalisePath("/%E0%A4%A")).toBeNull();
    expect(normalisePath("/a%00b")).toBeNull();
    expect(normalisePath("/a\u007fb")).toBeNull();
  });
});

describe("resolveRewrite (pure routing decision)", () => {
  it("answers 400 for a malformed host or path", () => {
    expect(resolveRewrite("a b", "/", ROOT)).toEqual({ kind: "bad", status: 400, reason: "host" });
    expect(resolveRewrite(null, "/", ROOT)).toEqual({ kind: "bad", status: 400, reason: "host" });
    expect(resolveRewrite("pizza.example.pk", "/%E0%A4%A", ROOT)).toEqual({ kind: "bad", status: 400, reason: "path" });
  });

  it("lets root hosts through and flags api/admin paths", () => {
    expect(resolveRewrite("EXAMPLE.PK:3000", "/super/login", ROOT)).toEqual({ kind: "root", host: "example.pk", isApi: false, isAdmin: true });
    expect(resolveRewrite("www.example.pk", "/api/lang", ROOT)).toMatchObject({ kind: "root", isApi: true, isAdmin: false });
    expect(resolveRewrite("preview-abc.vercel.app", "/", ROOT)).toMatchObject({ kind: "root", host: "preview-abc.vercel.app" });
  });

  it("blocks the internal tree on the root host, even when encoded", () => {
    expect(resolveRewrite("example.pk", "/_sites/foo.example.pk", ROOT)).toEqual({ kind: "block", status: 404 });
    expect(resolveRewrite("example.pk", "/%5Fsites", ROOT)).toEqual({ kind: "block", status: 404 });
    expect(resolveRewrite("example.pk", "//_sites/x", ROOT)).toEqual({ kind: "block", status: 404 });
    // `/_sitesx` is a different (legitimate) path, not the internal group.
    expect(resolveRewrite("example.pk", "/_sitesx", ROOT)).toMatchObject({ kind: "root" });
  });

  it("rewrites tenant pages, tags tenant API calls and blocks /_sites + /super on tenant hosts", () => {
    expect(resolveRewrite("Pizza.Example.PK", "/menu", ROOT)).toEqual({
      kind: "tenant",
      host: "pizza.example.pk",
      isApi: false,
      isAdmin: false,
      pathname: "/_sites/pizza.example.pk/menu",
    });
    expect(resolveRewrite("pizza.example.pk", "/", ROOT)).toMatchObject({ pathname: "/_sites/pizza.example.pk" });
    expect(resolveRewrite("pizza.example.pk", "/admin/products", ROOT)).toMatchObject({ kind: "tenant", isAdmin: true });
    expect(resolveRewrite("pizza.example.pk", "/api/media/presign", ROOT)).toEqual({
      kind: "tenant-api",
      host: "pizza.example.pk",
      isApi: true,
      isAdmin: false,
    });
    for (const p of ["/_sites/other.example.pk", "/%5Fsites", "/super", "/super/login", "/SUPER"]) {
      expect(resolveRewrite("pizza.example.pk", p, ROOT), p).toEqual({ kind: "block", status: 404 });
    }
    // Custom domains are tenants too.
    expect(resolveRewrite("www.karachipizza.com", "/shop/x", ROOT)).toMatchObject({ pathname: "/_sites/www.karachipizza.com/shop/x" });
  });
});

describe("proxy(req): root host", () => {
  it("passes root, www and Vercel preview hosts through untouched", () => {
    for (const host of ["example.pk", "www.example.pk", "EXAMPLE.PK", "example.pk:3000", "my-app-git-main.vercel.app"]) {
      const res = proxy(req(host, "/super/login"));
      expect(res.status, host).toBe(200);
      expect(res.headers.get("x-middleware-rewrite"), host).toBeNull();
      expect(res.headers.get("x-middleware-request-x-tenant-host"), host).toBeNull();
    }
  });

  it("blocks direct access to the internal _sites tree and rejects a malformed host", () => {
    expect(proxy(req("example.pk", "/_sites/foo.example.pk")).status).toBe(404);
    expect(proxy(req("bad host", "/")).status).toBe(400);
  });

  it("sends a nonce + report-only strict CSP on pages, none on API routes", () => {
    const page = proxy(req("example.pk", "/pricing"));
    const nonce = page.headers.get("x-middleware-request-x-nonce");
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
    const csp = page.headers.get("content-security-policy-report-only") ?? "";
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("report-uri /api/csp-report");
    expect(csp).toContain("frame-ancestors 'self'");

    const admin = proxy(req("example.pk", "/super/tenants"));
    expect(admin.headers.get("content-security-policy-report-only")).toContain("frame-ancestors 'none'");

    const api = proxy(req("example.pk", "/api/lang"));
    expect(api.headers.get("content-security-policy-report-only")).toBeNull();
    expect(api.headers.get("x-middleware-request-x-nonce")).toBeNull();
  });
});

describe("proxy(req): tenant hosts", () => {
  it("rewrites tenant pages to /_sites/<host>/<path> and forwards x-tenant-host", () => {
    const res = proxy(req("pizza.example.pk", "/menu?cat=deals"));
    const rewrite = res.headers.get("x-middleware-rewrite");
    expect(rewrite).toBeTruthy();
    const url = new URL(rewrite as string);
    expect(url.pathname).toBe("/_sites/pizza.example.pk/menu");
    expect(url.search).toBe("?cat=deals");
    expect(res.headers.get("x-middleware-request-x-tenant-host")).toBe("pizza.example.pk");
    expect(res.headers.get("x-middleware-request-x-request-host")).toBe("pizza.example.pk");
  });

  it("maps the tenant root path to /_sites/<host> without a trailing slash", () => {
    const rewrite = proxy(req("pizza.example.pk", "/")).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/pizza.example.pk");
  });

  it("normalises the Host header (port, trailing dot, case)", () => {
    const rewrite = proxy(req("Shop.Example.PK.:443", "/")).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/shop.example.pk");
  });

  it("ignores a client-supplied x-forwarded-host when not running on Vercel", () => {
    const rewrite = proxy(req("real.example.pk", "/", { "x-forwarded-host": "victim.example.pk" })).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/real.example.pk");
  });

  it("strips inbound routing/security headers a client could forge", () => {
    const res = proxy(
      req("pizza.example.pk", "/", {
        "x-tenant-host": "victim.example.pk",
        "x-request-host": "victim.example.pk",
        "x-nonce": "forged",
        "content-security-policy": "default-src *",
      }),
    );
    expect(res.headers.get("x-middleware-request-x-tenant-host")).toBe("pizza.example.pk");
    expect(res.headers.get("x-middleware-request-x-request-host")).toBe("pizza.example.pk");
    expect(res.headers.get("x-middleware-request-x-nonce")).not.toBe("forged");
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBeNull();
  });

  it("rewrites the tenant SEO files (sitemap, robots, manifest) to the tenant handlers", () => {
    for (const p of ["/sitemap.xml", "/robots.txt", "/manifest.webmanifest"]) {
      const res = proxy(req("pizza.example.pk", p));
      expect(res.status, p).toBe(200);
      const rewrite = res.headers.get("x-middleware-rewrite");
      expect(rewrite, p).toBeTruthy();
      expect(new URL(rewrite as string).pathname, p).toBe(`/_sites/pizza.example.pk${p}`);
      expect(res.headers.get("x-middleware-request-x-tenant-host"), p).toBe("pizza.example.pk");
    }
    for (const p of ["/sitemap.xml", "/robots.txt", "/manifest.webmanifest"]) {
      expect(resolveRewrite("www.karachipizza.com", p, ROOT), p).toMatchObject({ kind: "tenant", pathname: `/_sites/www.karachipizza.com${p}` });
    }
  });

  it("supports custom domains", () => {
    const rewrite = proxy(req("www.karachipizza.com", "/shop/x")).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/www.karachipizza.com/shop/x");
  });

  it("blocks /_sites and /super on tenant hosts", () => {
    expect(proxy(req("pizza.example.pk", "/_sites/other.example.pk")).status).toBe(404);
    expect(proxy(req("pizza.example.pk", "/super")).status).toBe(404);
    expect(proxy(req("pizza.example.pk", "/super/login")).status).toBe(404);
  });

  it("does not rewrite shared API routes but still tags the tenant host", () => {
    const res = proxy(req("pizza.example.pk", "/api/media/presign"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("x-middleware-request-x-tenant-host")).toBe("pizza.example.pk");
  });
});

describe("proxy(req) on Vercel", () => {
  let vercelProxy: ProxyModule["proxy"];
  beforeAll(async () => {
    vi.stubEnv("VERCEL", "1");
    vi.resetModules();
    ({ proxy: vercelProxy } = await import("@/proxy"));
  });

  it("prefers x-forwarded-host (set by the Vercel edge) over Host", () => {
    const rewrite = vercelProxy(req("ignored.example.pk", "/", { "x-forwarded-host": "Shop.Example.PK.:443" })).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/shop.example.pk");
  });

  it("falls back to Host when x-forwarded-host is malformed", () => {
    const rewrite = vercelProxy(req("shop.example.pk", "/", { "x-forwarded-host": "bad host" })).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/shop.example.pk");
  });
});
