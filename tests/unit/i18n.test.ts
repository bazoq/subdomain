import { describe, expect, it } from "vitest";
import { dirFor, LANGS, localizedString, ls, t, ui } from "@/lib/i18n";

describe("i18n.t (localized fallback)", () => {
  it("returns empty string for null/undefined", () => {
    expect(t(null)).toBe("");
    expect(t(undefined, "ur")).toBe("");
  });

  it("passes plain strings through untouched", () => {
    expect(t("Hello", "ur")).toBe("Hello");
  });

  it("returns English by default", () => {
    expect(t({ en: "Hello", ur: "ہیلو" })).toBe("Hello");
  });

  it("returns Urdu when requested and present", () => {
    expect(t({ en: "Hello", ur: "ہیلو" }, "ur")).toBe("ہیلو");
  });

  it("falls back to English when Urdu is missing or blank", () => {
    expect(t({ en: "Hello" }, "ur")).toBe("Hello");
    expect(t({ en: "Hello", ur: "   " }, "ur")).toBe("Hello");
    expect(t({ en: "Hello", ur: "" }, "ur")).toBe("Hello");
  });

  it("never returns undefined for a malformed value", () => {
    expect(t({} as never, "en")).toBe("");
  });
});

describe("i18n.ls / schema", () => {
  it("omits the ur key when not provided", () => {
    expect(ls("Hi")).toEqual({ en: "Hi" });
    expect(ls("Hi", "ہائے")).toEqual({ en: "Hi", ur: "ہائے" });
  });

  it("localizedString schema requires en and allows ur", () => {
    expect(localizedString.safeParse({ en: "x" }).success).toBe(true);
    expect(localizedString.safeParse({ en: "x", ur: "y" }).success).toBe(true);
    expect(localizedString.safeParse({ ur: "y" }).success).toBe(false);
    expect(localizedString.safeParse("x").success).toBe(false);
  });
});

describe("i18n.dirFor", () => {
  it("maps Urdu to rtl and English to ltr", () => {
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
    expect(LANGS).toEqual(["en", "ur"]);
  });
});

describe("i18n.ui dictionary", () => {
  it("every UI string has both English and non-empty Urdu", () => {
    for (const [key, value] of Object.entries(ui)) {
      expect(value.en.trim(), key).not.toBe("");
      expect(value.ur?.trim(), `${key} missing Urdu`).toBeTruthy();
    }
  });
});
