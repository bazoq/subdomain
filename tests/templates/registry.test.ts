import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, templateCode } from "@/lib/categories";
import { fieldsSchema } from "@/templates/fields";
import { getTemplateByCode, getTemplateMeta, TEMPLATES, templatesForCategory } from "@/templates/registry";
import { TEMPLATE_LOADERS } from "@/templates/metas";
import { collectTemplates, generate, renderRegistry } from "../../scripts/gen-registry.mjs";

const ROOT = process.cwd();

describe("template registry invariants", () => {
  it("registers exactly 84 templates", () => {
    expect(TEMPLATES).toHaveLength(84);
    expect(Object.keys(TEMPLATE_LOADERS)).toHaveLength(84);
  });

  it("ids and codes are unique and consistent with the category series", () => {
    const ids = TEMPLATES.map((t) => t.id);
    const codes = TEMPLATES.map((t) => t.code);
    expect(new Set(ids).size).toBe(84);
    expect(new Set(codes).size).toBe(84);
    for (const t of TEMPLATES) {
      expect(t.id, t.id).toMatch(/^[a-z]+-\d{2}$/);
      expect(t.id.startsWith(`${t.category}-`), `${t.id} category mismatch`).toBe(true);
      expect(t.code, t.id).toBe(templateCode(t.id));
      expect(TEMPLATE_LOADERS[t.id], `${t.id} has no loader`).toBeTypeOf("function");
    }
  });

  it("every category has its declared number of templates", () => {
    for (const c of CATEGORIES) {
      expect(templatesForCategory(c.key), c.key).toHaveLength(c.templateCount);
    }
  });

  it("lookup helpers resolve by id and by code", () => {
    expect(getTemplateMeta("pizza-01")?.code).toBe(901);
    expect(getTemplateByCode(901)?.id).toBe("pizza-01");
    expect(getTemplateByCode("1603")?.id).toBe("realestate-03");
    expect(getTemplateMeta("pizza-99")).toBeUndefined();
    expect(getTemplateByCode(1)).toBeUndefined();
  });

  it("every template has complete marketing meta, theme, nav and demo data", () => {
    for (const t of TEMPLATES) {
      expect(t.name.trim(), t.id).not.toBe("");
      expect(t.tagline.trim(), t.id).not.toBe("");
      expect(t.description.trim(), t.id).not.toBe("");
      expect(t.features.length, `${t.id} features`).toBeGreaterThan(0);
      expect(t.style.length, `${t.id} style`).toBeGreaterThan(0);
      expect(t.nav.length, `${t.id} nav`).toBeGreaterThan(0);
      expect(t.demo.name.trim(), t.id).not.toBe("");
      expect(t.demo.city.trim(), t.id).not.toBe("");
      expect(t.theme.fonts.heading.trim(), t.id).not.toBe("");
      expect(t.theme.fonts.body.trim(), t.id).not.toBe("");
      for (const [k, v] of Object.entries(t.theme.colors)) {
        expect(v, `${t.id} theme.colors.${k}`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
      for (const n of t.nav) expect(n.href, `${t.id} nav ${n.label.en}`).toMatch(/^(\/|#|https?:)/);
    }
  });
});

describe("template sections: defaults satisfy their own schema", () => {
  it("every section key is unique within its template and has fields", () => {
    for (const t of TEMPLATES) {
      const keys = t.sections.map((s) => s.key);
      expect(new Set(keys).size, `${t.id} duplicate section keys`).toBe(keys.length);
      expect(t.sections.length, `${t.id} has no sections`).toBeGreaterThan(0);
      for (const s of t.sections) expect(s.fields.length, `${t.id}/${s.key} has no fields`).toBeGreaterThan(0);
    }
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("%s: default content parses and round-trips", (_id, t) => {
    for (const s of t.sections) {
      const schema = fieldsSchema(s.fields);
      const r = schema.safeParse(s.defaults);
      expect(r.success, `${t.id}/${s.key}: ${r.success ? "" : JSON.stringify(r.error.issues.slice(0, 3))}`).toBe(true);
      if (!r.success) continue;
      // Defaults must be complete (schema adds nothing) so the admin editor shows real content.
      expect(r.data, `${t.id}/${s.key} defaults incomplete`).toEqual(s.defaults);
      // Field keys are unique within a section.
      const keys = s.fields.map((f) => f.key);
      expect(new Set(keys).size, `${t.id}/${s.key} duplicate field keys`).toBe(keys.length);
    }
  });
});

describe("scripts/gen-registry.mjs", () => {
  it("discovers the same 84 template folders as the committed registry", () => {
    const entries = collectTemplates(join(ROOT, "src", "templates"));
    expect(entries).toHaveLength(84);
    expect(entries.map((e) => e.id).sort()).toEqual(TEMPLATES.map((t) => t.id).sort());
  });

  it("is deterministic and the committed metas.ts is up to date", () => {
    const a = generate(ROOT);
    const b = generate(ROOT);
    expect(a.source).toBe(b.source);
    expect(a.source).toBe(renderRegistry(a.entries));
    const committed = readFileSync(join(ROOT, "src", "templates", "metas.ts"), "utf8").replace(/\r\n/g, "\n");
    expect(committed, "src/templates/metas.ts is stale — run `npm run gen:templates`").toBe(a.source);
  });

  it("orders entries by category then folder", () => {
    const { entries } = generate(ROOT);
    const sorted = [...entries].sort((x, y) => (x.cat === y.cat ? x.nn.localeCompare(y.nn) : x.cat.localeCompare(y.cat)));
    expect(entries).toEqual(sorted);
  });
});
