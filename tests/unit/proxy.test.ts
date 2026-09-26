import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Host-based routing in src/proxy.ts. ROOT_DOMAIN is read at module load, so the module is
 * imported after the env is stubbed. Only the exported `proxy(req)` is public; the host helpers
 * are private (see the platform-dx handoff to the security stream).
 */
type Proxy = typeof import("@/proxy");
let proxy: Proxy["proxy"];

function req(host: string, path = "/", extraHeaders: Record<string, string> = {}) {
  return new NextRequest(`https://internal.invalid${path}`, { headers: { host, ...extraHeaders } });
}

beforeAll(async () => {
  vi.stubEnv("ROOT_DOMAIN", "Example.PK");
  vi.resetModules();
  ({ proxy } = await import("@/proxy"));
});

describe("proxy: root host", () => {
  it("passes root, www and Vercel preview hosts through untouched", () => {
    for (const host of ["example.pk", "www.example.pk", "EXAMPLE.PK", "example.pk:3000", "my-app-git-main.vercel.app"]) {
      const res = proxy(req(host, "/super/login"));
      expect(res.status, host).toBe(200);
      expect(res.headers.get("x-middleware-rewrite"), host).toBeNull();
      expect(res.headers.get("x-middleware-request-x-tenant-host"), host).toBeNull();
    }
  });

  it("blocks direct access to the internal _sites tree", () => {
    expect(proxy(req("example.pk", "/_sites/foo.example.pk")).status).toBe(404);
  });
});

describe("proxy: tenant hosts", () => {
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

  it("normalises the host: strips port, trailing dot and case; prefers x-forwarded-host", () => {
    const rewrite = proxy(req("ignored.example.pk", "/", { "x-forwarded-host": "Shop.Example.PK.:443" })).headers.get("x-middleware-rewrite");
    expect(new URL(rewrite as string).pathname).toBe("/_sites/shop.example.pk");
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
