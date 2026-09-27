import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `currentLang()` / `getSiteContext()` (src/server/site.ts): cookie wins, then the tenant's
 * `settings.languages.defaultLang`; Urdu is only honoured when the tenant enabled it. The tenant lookup
 * and Next's `cookies()` are mocked — no request scope, no database.
 */

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  tenant: null as null | { settings: { languages: { urduEnabled: boolean; defaultLang?: "en" | "ur" } } },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "sf_lang" && state.cookie !== undefined ? { name, value: state.cookie } : undefined) }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
vi.mock("@/server/tenant", () => ({ getCurrentTenant: async () => state.tenant }));
vi.mock("@/server/site-content", () => ({ buildSiteContext: vi.fn(async (_tc: unknown, lang: string) => ({ lang })) }));

const { currentLang, getSiteContext, LANG_COOKIE } = await import("@/server/site");
const { buildSiteContext } = await import("@/server/site-content");

const tenant = (urduEnabled: boolean, defaultLang?: "en" | "ur") => ({ settings: { languages: { urduEnabled, defaultLang } } });

beforeEach(() => {
  state.cookie = undefined;
  state.tenant = null;
});

describe("currentLang", () => {
  it("uses the tenant default language when the visitor has no cookie", async () => {
    state.tenant = tenant(true, "ur");
    expect(await currentLang()).toBe("ur");
    state.tenant = tenant(true, "en");
    expect(await currentLang()).toBe("en");
    state.tenant = tenant(true);
    expect(await currentLang()).toBe("en");
  });

  it("lets the visitor cookie override the tenant default", async () => {
    state.tenant = tenant(true, "ur");
    state.cookie = "en";
    expect(await currentLang()).toBe("en");
    state.tenant = tenant(true, "en");
    state.cookie = "ur";
    expect(await currentLang()).toBe("ur");
  });

  it("never returns Urdu when the tenant has not enabled it", async () => {
    state.tenant = tenant(false, "ur");
    expect(await currentLang()).toBe("en");
    state.cookie = "ur";
    expect(await currentLang()).toBe("en");
  });

  it("ignores garbage cookie values", async () => {
    state.tenant = tenant(true, "ur");
    state.cookie = "fr";
    expect(await currentLang()).toBe("ur");
    state.cookie = "";
    expect(await currentLang()).toBe("ur");
  });

  it("falls back to the cookie only when no tenant is resolved", async () => {
    expect(await currentLang()).toBe("en");
    state.cookie = "ur";
    expect(await currentLang()).toBe("ur");
    state.cookie = "xx";
    expect(await currentLang()).toBe("en");
  });

  it("reads the documented cookie name", () => {
    expect(LANG_COOKIE).toBe("sf_lang");
  });
});

describe("getSiteContext", () => {
  it("builds the site context in the resolved language (tenant default Urdu)", async () => {
    state.tenant = tenant(true, "ur");
    expect(await getSiteContext()).toEqual({ lang: "ur" });
    expect(buildSiteContext).toHaveBeenCalledWith(state.tenant, "ur");
  });

  it("forces English for tenants without Urdu even with an Urdu cookie", async () => {
    state.tenant = tenant(false, "ur");
    state.cookie = "ur";
    expect(await getSiteContext()).toEqual({ lang: "en" });
  });

  it("calls notFound for unknown hosts", async () => {
    await expect(getSiteContext()).rejects.toThrow(/404/);
  });
});
