import { describe, expect, it } from "vitest";
import { f, fieldsSchema } from "@/templates/fields";

const fields = [
  f.text("title", "Title", { maxLength: 10 }),
  f.localized("heading", "Heading"),
  f.number("count", "Count", { min: 0, max: 10 }),
  f.boolean("show", "Show"),
  f.select("align", "Align", [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
  ]),
  f.color("tint", "Tint"),
  f.image("hero", "Hero"),
  f.images("gallery", "Gallery", { max: 2 }),
  f.link("cta", "CTA"),
  f.icon("icon", "Icon"),
  f.repeater("items", "Items", [f.localized("label", "Label"), f.number("price", "Price")], { max: 2 }),
];

describe("fieldsSchema (template section DSL)", () => {
  const schema = fieldsSchema(fields);

  it("fills every field with a safe default from an empty object", () => {
    expect(schema.parse({})).toEqual({
      title: "",
      heading: { en: "" },
      count: 0,
      show: false,
      align: "left",
      tint: "",
      hero: "",
      gallery: [],
      cta: { label: { en: "" }, href: "" },
      icon: "",
      items: [],
    });
  });

  it("coerces numbers and drops unknown keys", () => {
    const out = schema.parse({ count: "7", unknown: "x" });
    expect(out.count).toBe(7);
    expect(out).not.toHaveProperty("unknown");
  });

  it("enforces limits (text length, number range, images max, repeater max, colour format)", () => {
    expect(schema.safeParse({ title: "12345678901" }).success).toBe(false);
    expect(schema.safeParse({ count: 11 }).success).toBe(false);
    expect(schema.safeParse({ gallery: ["a", "b", "c"] }).success).toBe(false);
    expect(schema.safeParse({ items: [{}, {}, {}] }).success).toBe(false);
    expect(schema.safeParse({ tint: "red" }).success).toBe(false);
    expect(schema.safeParse({ tint: "#ff0000" }).success).toBe(true);
  });

  it("validates nested repeater items with their own defaults", () => {
    const out = schema.parse({ items: [{ label: { en: "Naan" } }] });
    expect(out.items).toEqual([{ label: { en: "Naan" }, price: 0 }]);
  });
});
