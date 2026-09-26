import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_MAP, categoryHas, getCategory, templateCode, TOTAL_TEMPLATES } from "@/lib/categories";

const EXPECTED_COUNTS: Record<string, number> = {
  kitchen: 4,
  printing: 4,
  clothing: 4,
  shoes: 4,
  gifts: 4,
  blades: 4,
  recruiting: 10,
  travel: 10,
  pizza: 10,
  sports: 5,
  gym: 5,
  bakery: 5,
  law: 6,
  electronics: 3,
  medical: 3,
  realestate: 3,
};

describe("categories catalogue", () => {
  it("has exactly 16 categories with the agreed template counts (84 total)", () => {
    expect(CATEGORIES).toHaveLength(16);
    expect(Object.keys(EXPECTED_COUNTS)).toHaveLength(16);
    for (const c of CATEGORIES) expect(c.templateCount, c.key).toBe(EXPECTED_COUNTS[c.key]);
    expect(TOTAL_TEMPLATES).toBe(84);
  });

  it("uses unique keys and unique, ascending 100-step series", () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    const series = CATEGORIES.map((c) => c.series);
    expect(new Set(series).size).toBe(series.length);
    series.forEach((s, i) => expect(s).toBe((i + 1) * 100));
  });

  it("every category has the shared modules and at least one primary module", () => {
    for (const c of CATEGORIES) {
      for (const m of ["testimonials", "faq", "gallery", "leads", "posts"] as const) expect(c.modules, c.key).toContain(m);
      expect(c.modules.length).toBeGreaterThan(5);
      expect(c.nameUr.trim()).not.toBe("");
      expect(c.icon.trim()).not.toBe("");
    }
  });

  it("CATEGORY_MAP / getCategory resolve keys and reject unknown ones", () => {
    expect(CATEGORY_MAP.pizza.series).toBe(900);
    expect(getCategory("pizza")?.kind).toBe("restaurant");
    expect(getCategory("nope")).toBeUndefined();
    expect(categoryHas("kitchen", "ecommerce")).toBe(true);
    expect(categoryHas("kitchen", "restaurant")).toBe(false);
    expect(categoryHas("nope", "ecommerce")).toBe(false);
  });
});

describe("templateCode", () => {
  it("computes series + number for every template of every category", () => {
    for (const c of CATEGORIES) {
      for (let n = 1; n <= c.templateCount; n++) {
        const id = `${c.key}-${String(n).padStart(2, "0")}`;
        expect(templateCode(id), id).toBe(c.series + n);
      }
    }
  });

  it("matches the documented examples", () => {
    expect(templateCode("kitchen-01")).toBe(101);
    expect(templateCode("sports-03")).toBe(1003);
    expect(templateCode("realestate-03")).toBe(1603);
  });

  it("produces globally unique codes across all 84 templates", () => {
    const codes = CATEGORIES.flatMap((c) =>
      Array.from({ length: c.templateCount }, (_, i) => templateCode(`${c.key}-${String(i + 1).padStart(2, "0")}`)),
    );
    expect(codes).toHaveLength(84);
    expect(new Set(codes).size).toBe(84);
  });

  it("falls back to the bare number for unknown categories", () => {
    expect(templateCode("unknown-05")).toBe(5);
  });
});
