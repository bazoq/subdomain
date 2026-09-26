import { describe, expect, it } from "vitest";
import { clamp, cn, formatPKR, normalizePkPhone, safeJson, slugify, truncate, whatsappLink } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional classes and resolves tailwind conflicts", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
    expect(cn("text-sm", { "font-bold": true, italic: false })).toBe("text-sm font-bold");
  });
});

describe("slugify", () => {
  it("lowercases, strips accents and collapses separators", () => {
    expect(slugify("Karachi Pizza & Grill")).toBe("karachi-pizza-grill");
    expect(slugify("  Café Déjà Vu ")).toBe("cafe-deja-vu");
    expect(slugify("--already--slug--")).toBe("already-slug");
  });
  it("caps the length at 80 characters", () => {
    expect(slugify("a".repeat(120))).toHaveLength(80);
  });
  it("returns an empty string for non-latin-only input", () => {
    expect(slugify("کراچی")).toBe("");
  });
});

describe("formatPKR", () => {
  it("formats integer rupees with grouping", () => {
    expect(formatPKR(0)).toBe("Rs 0");
    expect(formatPKR(12500)).toBe("Rs 12,500");
    expect(formatPKR(1250000)).toBe("Rs 1,250,000");
  });
  it("uses Lac / Crore in compact mode", () => {
    expect(formatPKR(100_000, { compact: true })).toBe("Rs 1 Lac");
    expect(formatPKR(250_000, { compact: true })).toBe("Rs 2.50 Lac");
    expect(formatPKR(10_000_000, { compact: true })).toBe("Rs 1 Crore");
    expect(formatPKR(12_500_000, { compact: true })).toBe("Rs 1.25 Crore");
    expect(formatPKR(99_999, { compact: true })).toBe("Rs 99,999");
  });
});

describe("normalizePkPhone", () => {
  it("normalises every common mobile format to +923XXXXXXXXX", () => {
    for (const raw of ["03001234567", "+92 300 1234567", "0092-300-1234567", "923001234567", "3001234567", "0300 123 4567"]) {
      expect(normalizePkPhone(raw), raw).toBe("+923001234567");
    }
  });
  it("accepts landlines with area code", () => {
    expect(normalizePkPhone("021-35678901")).toBe("+922135678901");
    expect(normalizePkPhone("+92 42 35678901")).toBe("+924235678901");
  });
  it("rejects invalid numbers", () => {
    expect(normalizePkPhone("12345")).toBeNull();
    expect(normalizePkPhone("")).toBeNull();
    expect(normalizePkPhone("+1 415 555 0100")).toBeNull();
    expect(normalizePkPhone("0300123456")).toBeNull(); // one digit short
  });
});

describe("whatsappLink", () => {
  it("strips formatting and encodes the preset text", () => {
    expect(whatsappLink("+92 300-1234567")).toBe("https://wa.me/923001234567");
    expect(whatsappLink("+923001234567", "Salam & hello")).toBe("https://wa.me/923001234567?text=Salam%20%26%20hello");
  });
});

describe("truncate / clamp / safeJson", () => {
  it("truncate keeps short strings and shortens long ones", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a very long sentence", 8)).toBe("a very ...");
  });
  it("clamp bounds numbers", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it("safeJson returns fallback only for null/undefined", () => {
    expect(safeJson(null, [])).toEqual([]);
    expect(safeJson(undefined, { a: 1 })).toEqual({ a: 1 });
    expect(safeJson({ b: 2 }, { a: 1 })).toEqual({ b: 2 });
  });
});
