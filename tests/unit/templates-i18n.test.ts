import { describe, expect, it } from "vitest";
import { z } from "zod";
import { TEMPLATES } from "@/templates/registry";
import { fieldsSchema, localizedOrString, type Field } from "@/templates/fields";
import { heroSection, aboutSection } from "@/templates/shared/sections";
import { destinationsSection, areasSection } from "@/templates/shared/packs";
import { t } from "@/lib/i18n";
import { formatPKR } from "@/lib/utils";

/**
 * Template i18n (wave-4): every user-visible section string — including the small `eyebrow` labels and the
 * destinations/areas `note` — is a LocalizedString with English and Urdu defaults, and the schema still accepts
 * the legacy plain-string rows tenants saved while those fields were `f.text` (otherwise `normaliseSectionData`
 * would throw the whole section away and fall back to defaults).
 */

type Localized = { en: string; ur?: string };
const isLocalized = (v: unknown): v is Localized => typeof v === "object" && v !== null && typeof (v as Localized).en === "string";

/** Every `{ en }` object anywhere inside `value`, with a path for the assertion message. */
function collectLocalized(value: unknown, path: string, out: { path: string; value: Localized }[] = []) {
  if (isLocalized(value)) {
    out.push({ path, value });
    return out;
  }
  if (Array.isArray(value)) value.forEach((v, i) => collectLocalized(v, `${path}[${i}]`, out));
  else if (typeof value === "object" && value !== null) for (const [k, v] of Object.entries(value)) collectLocalized(v, `${path}.${k}`, out);
  return out;
}

/** Every field (recursing into repeaters) with its dotted path. */
function walkFields(fields: Field[], prefix = ""): { path: string; field: Field }[] {
  return fields.flatMap((f) => {
    const path = prefix + f.key;
    return f.type === "repeater" ? [{ path, field: f }, ...walkFields(f.fields, path + ".")] : [{ path, field: f }];
  });
}

describe("template registry", () => {
  it("exposes all 84 templates across 16 categories", () => {
    expect(TEMPLATES).toHaveLength(84);
    expect(new Set(TEMPLATES.map((m) => m.category)).size).toBe(16);
  });
});

describe("section defaults", () => {
  it("parse through their own schema for every template and section", () => {
    for (const meta of TEMPLATES) {
      for (const s of meta.sections) {
        const r = fieldsSchema(s.fields).safeParse(s.defaults);
        expect(r.success, `${meta.id}/${s.key}: ${r.success ? "" : r.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`).toBe(true);
      }
    }
  });

  it("declare every eyebrow and destination/area note as a localized field", () => {
    for (const meta of TEMPLATES) {
      for (const s of meta.sections) {
        for (const { path, field } of walkFields(s.fields)) {
          if (field.key === "eyebrow") expect(field.type, `${meta.id}/${s.key}.${path}`).toBe("localized");
          if (field.key === "note" && (s.key === "destinations" || s.key === "areas")) expect(field.type, `${meta.id}/${s.key}.${path}`).toBe("localized");
        }
      }
    }
  });

  it("give every hero an English and an Urdu eyebrow, title and subtitle", () => {
    for (const meta of TEMPLATES) {
      const hero = meta.sections.find((s) => s.key === "hero");
      expect(hero, meta.id).toBeDefined();
      const d = hero!.defaults as Record<string, unknown>;
      for (const key of ["eyebrow", "title", "subtitle"] as const) {
        const v = d[key];
        expect(isLocalized(v), `${meta.id}/hero.${key} is not localized`).toBe(true);
        expect(t(v as Localized, "en").trim(), `${meta.id}/hero.${key}.en`).not.toBe("");
        expect((v as Localized).ur?.trim() ?? "", `${meta.id}/hero.${key}.ur`).not.toBe("");
        // Urdu must be real Urdu, not a copy of the English
        expect((v as Localized).ur, `${meta.id}/hero.${key}.ur === en`).not.toBe((v as Localized).en);
      }
    }
  });

  it("ship Urdu for every non-empty localized default in every section", () => {
    const missing: string[] = [];
    for (const meta of TEMPLATES) {
      for (const s of meta.sections) {
        for (const { path, value } of collectLocalized(s.defaults, `${meta.id}/${s.key}`)) {
          if (value.en.trim() && !value.ur?.trim()) missing.push(path);
        }
      }
    }
    expect(missing, `localized defaults without Urdu:\n${missing.join("\n")}`).toEqual([]);
  });

  it("format rupee amounts in destination notes with formatPKR in both languages", () => {
    const hunza = destinationsSection.defaults.items[1];
    expect(hunza.note.en).toBe(`5 days from ${formatPKR(45_000)}`);
    expect(hunza.note.en).toContain("Rs 45,000");
    expect(hunza.note.ur).toContain(formatPKR(45_000, { lang: "ur" }));
    expect(hunza.note.ur).toContain("روپے");
    // the northern-areas blueprint overrides the destinations repeater with its own priced notes
    type Dest = typeof destinationsSection.defaults;
    const northern = TEMPLATES.map((m) => ({ id: m.id, d: m.sections.find((s) => s.key === "destinations")?.defaults as Dest | undefined })).find(
      ({ d }) => d?.items.some((it) => it.name.en === "Swat & Kalam"),
    );
    expect(northern, "a travel blueprint overriding destinations with Swat & Kalam").toBeDefined();
    for (const it of northern!.d!.items) {
      expect(it.note.en, `${northern!.id} ${it.name.en}`).toMatch(/^\d days from Rs [\d,]+$/);
      expect(it.note.ur, `${northern!.id} ${it.name.en}`).toMatch(/روپے/);
    }
  });
});

describe("legacy plain-string rows", () => {
  const heroSchema = fieldsSchema(heroSection.fields);

  it("coerce a plain-string eyebrow to { en } instead of failing the whole section", () => {
    const stored = { ...heroSection.defaults, eyebrow: "Since 2012 · Lahore", title: { en: "Tenant headline", ur: "سرخی" } };
    const r = heroSchema.safeParse(stored);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.eyebrow).toEqual({ en: "Since 2012 · Lahore" });
    // nothing else the tenant saved is lost
    expect(r.data.title).toEqual({ en: "Tenant headline", ur: "سرخی" });
    expect(t(r.data.eyebrow as Localized, "ur")).toBe("Since 2012 · Lahore"); // falls back to English
  });

  it("coerce plain-string link labels and rich text too", () => {
    const aboutSchema = fieldsSchema(aboutSection.fields);
    const r = aboutSchema.safeParse({ ...aboutSection.defaults, body: "Plain about text", cta: { label: "Call us", href: "/contact" } });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.body).toEqual({ en: "Plain about text" });
    expect(r.data.cta).toEqual({ label: { en: "Call us" }, href: "/contact" });
  });

  it("coerce plain-string destination and area notes inside repeaters", () => {
    const dest = fieldsSchema(destinationsSection.fields).safeParse({
      ...destinationsSection.defaults,
      items: [{ name: { en: "Hunza" }, image: "", href: "/packages", note: "5 days from Rs 45,000" }],
    });
    expect(dest.success).toBe(true);
    if (dest.success) expect((dest.data as { items: { note: unknown }[] }).items[0].note).toEqual({ en: "5 days from Rs 45,000" });

    const areas = fieldsSchema(areasSection.fields).safeParse({
      ...areasSection.defaults,
      items: [{ name: "DHA", image: "", href: "/properties", note: "Plots" }],
    });
    expect(areas.success).toBe(true);
    if (areas.success) expect((areas.data as { items: { note: unknown }[] }).items[0].note).toEqual({ en: "Plots" });
  });

  it("still accepts proper localized objects and rejects other shapes", () => {
    expect(localizedOrString.parse({ en: "Hi", ur: "ہیلو" })).toEqual({ en: "Hi", ur: "ہیلو" });
    expect(localizedOrString.parse("Hi")).toEqual({ en: "Hi" });
    expect(localizedOrString.safeParse(42).success).toBe(false);
    expect(localizedOrString.safeParse({ ur: "only urdu" }).success).toBe(false);
    expect(z.object({ eyebrow: localizedOrString }).parse({ eyebrow: "" })).toEqual({ eyebrow: { en: "" } });
  });
});
