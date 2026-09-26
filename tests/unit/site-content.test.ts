import { describe, expect, it, vi } from "vitest";
import { getTemplateMeta } from "@/templates/registry";

vi.mock("@/server/db", () => ({ db: {} }));

const { normaliseSectionData } = await import("@/server/site-content");

describe("normaliseSectionData", () => {
  const meta = getTemplateMeta("pizza-01");
  if (!meta) throw new Error("pizza-01 must exist");
  const first = meta.sections[0];

  it("returns null for an unknown section key", () => {
    expect(normaliseSectionData(meta, "does-not-exist", {})).toBeNull();
  });

  it("returns the defaults when nothing was saved", () => {
    expect(normaliseSectionData(meta, first.key, undefined)).toEqual(first.defaults);
    expect(normaliseSectionData(meta, first.key, null)).toEqual(first.defaults);
  });

  it("merges saved values over defaults and drops unknown keys", () => {
    const textField = first.fields.find((f) => f.type === "localized" || f.type === "text");
    if (!textField) throw new Error("expected a text-like field in the first section");
    const saved = { [textField.key]: textField.type === "text" ? "Saved" : { en: "Saved", ur: "محفوظ" }, junk: true };
    const out = normaliseSectionData(meta, first.key, saved);
    expect(out).not.toBeNull();
    expect(out?.[textField.key]).toEqual(saved[textField.key]);
    expect(out).not.toHaveProperty("junk");
    for (const f of first.fields) if (f.key !== textField.key) expect(out?.[f.key]).toEqual((first.defaults as Record<string, unknown>)[f.key]);
  });

  it("falls back to defaults when the stored blob is corrupt", () => {
    const anyField = first.fields[0];
    const corrupt = { [anyField.key]: anyField.type === "repeater" ? "not-an-array" : { totally: "wrong", shape: [1, 2] } };
    // A wrong-typed value for any field makes the whole blob invalid -> defaults win.
    const out = normaliseSectionData(meta, first.key, corrupt);
    expect(out).toEqual(first.defaults);
  });
});
