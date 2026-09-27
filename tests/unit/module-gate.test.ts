import { describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import { CATEGORIES, CATEGORY_MAP, type ModuleKey } from "@/lib/categories";
import { MODULE_UNAVAILABLE, hasModule, moduleUnavailable, requireModulePage } from "@/modules/shared/module-gate";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

/** Module gating (src/modules/shared/module-gate.ts): a tenant only gets the modules its business category grants. */

const ALL_MODULES = [...new Set(CATEGORIES.flatMap((c) => c.modules))] as ModuleKey[];
const ctxFor = (key: keyof typeof CATEGORY_MAP) => ({ category: CATEGORY_MAP[key] });

describe("hasModule", () => {
  it("is true exactly for the category's own modules", () => {
    for (const cat of CATEGORIES) {
      const ctx = { category: cat };
      for (const m of ALL_MODULES) expect(hasModule(ctx, m), `${cat.key}:${m}`).toBe(cat.modules.includes(m));
    }
  });

  it("keeps business modules apart (bakery has no jobs, recruiting has no shop)", () => {
    expect(hasModule(ctxFor("pizza"), "restaurant")).toBe(true);
    expect(hasModule(ctxFor("pizza"), "ecommerce")).toBe(false);
    expect(hasModule(ctxFor("bakery"), "recruiting")).toBe(false);
    expect(hasModule(ctxFor("recruiting"), "recruiting")).toBe(true);
    expect(hasModule(ctxFor("recruiting"), "ecommerce")).toBe(false);
    expect(hasModule(ctxFor("medical"), "medical")).toBe(true);
    expect(hasModule(ctxFor("medical"), "ecommerce")).toBe(true);
    expect(hasModule(ctxFor("clothing"), "medical")).toBe(false);
  });
});

describe("requireModulePage", () => {
  it("returns silently when the module exists", () => {
    expect(() => requireModulePage(ctxFor("gym"), "gym")).not.toThrow();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("renders the 404 page (notFound) for a module the category does not have", () => {
    expect(() => requireModulePage(ctxFor("gym"), "restaurant")).toThrow(/404/);
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

describe("moduleUnavailable", () => {
  it("is a plain failed action result with the shared message", () => {
    expect(moduleUnavailable()).toEqual({ ok: false, message: MODULE_UNAVAILABLE, fieldErrors: undefined });
    expect(MODULE_UNAVAILABLE).toMatch(/not available/i);
  });
});
