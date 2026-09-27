import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// api-auth.ts pulls in the session store and tenant resolver (both DB-backed) for resolveActor();
// assertSameOrigin is pure over the request headers, so those modules are stubbed.
vi.mock("@/server/auth/session", () => ({ getSuperSession: vi.fn(), getTenantSession: vi.fn() }));
vi.mock("@/server/tenant", () => ({ getCurrentTenant: vi.fn() }));

const { assertSameOrigin } = await import("@/server/api-auth");

function req(headers: Record<string, string>) {
  return new NextRequest("https://internal.invalid/api/media/presign", { method: "POST", headers });
}

const HOST = "pizza.example.pk";

describe("assertSameOrigin", () => {
  it("allows a same-origin browser POST (Origin matches Host)", () => {
    expect(assertSameOrigin(req({ host: HOST, origin: `https://${HOST}`, "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(assertSameOrigin(req({ host: HOST, origin: `https://${HOST}` }))).toBeNull();
    expect(assertSameOrigin(req({ host: `${HOST}:443`, origin: `https://${HOST}:443` }))).toBeNull();
    expect(assertSameOrigin(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBeNull();
  });

  it("prefers x-request-host (set by the proxy) over Host", () => {
    expect(assertSameOrigin(req({ host: "internal.invalid", "x-request-host": HOST, origin: `https://${HOST}` }))).toBeNull();
    expect(assertSameOrigin(req({ host: HOST, "x-request-host": "other.example.pk", origin: `https://${HOST}` }))?.status).toBe(403);
  });

  it("falls back to Referer when Origin is absent or 'null'", () => {
    expect(assertSameOrigin(req({ host: HOST, referer: `https://${HOST}/admin/media?x=1` }))).toBeNull();
    expect(assertSameOrigin(req({ host: HOST, origin: "null", referer: `https://${HOST}/admin` }))).toBeNull();
    expect(assertSameOrigin(req({ host: HOST, origin: "null" }))?.status).toBe(403);
  });

  it("rejects cross-site requests (Origin / Referer mismatch)", () => {
    for (const source of [
      "https://evil.example",
      `https://${HOST}.evil.example`,
      `https://evil.example/${HOST}`,
      `https://${HOST}@evil.example`,
      `https://not${HOST}`,
      "https://example.pk",
    ]) {
      const res = assertSameOrigin(req({ host: HOST, origin: source }));
      expect(res?.status, source).toBe(403);
    }
    expect(assertSameOrigin(req({ host: HOST, referer: "https://evil.example/" }))?.status).toBe(403);
  });

  it("rejects when Sec-Fetch-Site says cross-site even if Origin looks right", () => {
    expect(assertSameOrigin(req({ host: HOST, origin: `https://${HOST}`, "sec-fetch-site": "cross-site" }))?.status).toBe(403);
    expect(assertSameOrigin(req({ host: HOST, origin: `https://${HOST}`, "sec-fetch-site": "same-site" }))?.status).toBe(403);
  });

  it("accepts a missing Origin/Referer only when Sec-Fetch-Site is same-origin", () => {
    expect(assertSameOrigin(req({ host: HOST, "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(assertSameOrigin(req({ host: HOST, "sec-fetch-site": "none" }))?.status).toBe(403);
    expect(assertSameOrigin(req({ host: HOST }))?.status).toBe(403);
  });

  it("rejects non-http(s) or unparsable sources and a missing/malformed Host", () => {
    expect(assertSameOrigin(req({ host: HOST, origin: `ftp://${HOST}` }))?.status).toBe(403);
    expect(assertSameOrigin(req({ host: HOST, origin: "not a url" }))?.status).toBe(403);
    expect(assertSameOrigin(req({ origin: `https://${HOST}` }))?.status).toBe(403);
    expect(assertSameOrigin(req({ host: "a b", origin: "https://a b" }))?.status).toBe(403);
  });

  it("answers with a JSON 403 body", async () => {
    const res = assertSameOrigin(req({ host: HOST, origin: "https://evil.example" }));
    expect(res?.status).toBe(403);
    await expect(res?.json()).resolves.toEqual({ error: "Forbidden" });
  });
});
