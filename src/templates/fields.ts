import { z } from "zod";
import { localizedString, type LocalizedString } from "@/lib/i18n";

/**
 * Field DSL used by every template section. One declaration drives:
 *   - the zod schema (validation on save)
 *   - the auto-generated admin form
 *   - the TypeScript type of the section content
 */

export type FieldBase = { key: string; label: string; help?: string };

export type Field =
  | (FieldBase & { type: "text"; maxLength?: number; placeholder?: string })
  | (FieldBase & { type: "localized"; multiline?: boolean; maxLength?: number })
  | (FieldBase & { type: "richtext" })
  | (FieldBase & { type: "number"; min?: number; max?: number })
  | (FieldBase & { type: "boolean" })
  | (FieldBase & { type: "select"; options: { value: string; label: string }[] })
  | (FieldBase & { type: "color" })
  | (FieldBase & { type: "image" })
  | (FieldBase & { type: "images"; max?: number })
  | (FieldBase & { type: "link" })
  | (FieldBase & { type: "icon" })
  | (FieldBase & { type: "repeater"; fields: Field[]; min?: number; max?: number; itemLabel?: string });

export type LinkValue = { label: LocalizedString; href: string };

/* ---------- type inference ---------- */
type FieldValue<F extends Field> = F extends { type: "text" }
  ? string
  : F extends { type: "localized" }
    ? LocalizedString
    : F extends { type: "richtext" }
      ? LocalizedString
      : F extends { type: "number" }
        ? number
        : F extends { type: "boolean" }
          ? boolean
          : F extends { type: "select" }
            ? string
            : F extends { type: "color" }
              ? string
              : F extends { type: "image" }
                ? string
                : F extends { type: "images" }
                  ? string[]
                  : F extends { type: "link" }
                    ? LinkValue
                    : F extends { type: "icon" }
                      ? string
                      : F extends { type: "repeater"; fields: infer Sub extends Field[] }
                        ? InferFields<Sub>[]
                        : never;

export type InferFields<Fs extends readonly Field[]> = {
  [F in Fs[number] as F["key"]]: FieldValue<F>;
};

/* ---------- zod builder ---------- */
/**
 * Localized value that also accepts a legacy plain string (`"Welcome"` → `{ en: "Welcome" }`).
 * Fields that were `f.text` before (hero/about/… `eyebrow`, destinations `note`) have rows saved
 * as strings; without this coercion the whole section would fail validation and fall back to the
 * template defaults, discarding the tenant's edits.
 */
export const localizedOrString = z.preprocess((v) => (typeof v === "string" ? { en: v } : v), localizedString);

const linkSchema = z.object({ label: localizedOrString, href: z.string().max(500) });

function fieldSchema(f: Field): z.ZodTypeAny {
  switch (f.type) {
    case "text":
      return z.string().max(f.maxLength ?? 500).default("");
    case "localized":
      return localizedOrString.default({ en: "" });
    case "richtext":
      return localizedOrString.default({ en: "" });
    case "number":
      return z.coerce.number().min(f.min ?? -1e12).max(f.max ?? 1e12).default(0);
    case "boolean":
      return z.coerce.boolean().default(false);
    case "select":
      return z.string().default(f.options[0]?.value ?? "");
    case "color":
      return z.string().regex(/^#[0-9a-fA-F]{3,8}$|^$/).default("");
    case "image":
      return z.string().max(1000).default("");
    case "images":
      return z.array(z.string().max(1000)).max(f.max ?? 40).default([]);
    case "link":
      return linkSchema.default({ label: { en: "" }, href: "" });
    case "icon":
      return z.string().max(60).default("");
    case "repeater":
      return z.array(fieldsSchema(f.fields)).max(f.max ?? 50).default([]);
  }
}

export function fieldsSchema(fields: Field[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) shape[f.key] = fieldSchema(f);
  return z.object(shape);
}

/* ---------- ergonomic constructors ---------- */
export const f = {
  text: <K extends string>(key: K, label: string, o: Partial<Omit<Extract<Field, { type: "text" }>, "key" | "label" | "type">> = {}) => ({ type: "text", key, label, ...o }) as const,
  localized: <K extends string>(key: K, label: string, o: Partial<Omit<Extract<Field, { type: "localized" }>, "key" | "label" | "type">> = {}) =>
    ({ type: "localized", key, label, ...o }) as const,
  richtext: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "richtext", key, label, ...o }) as const,
  number: <K extends string>(key: K, label: string, o: Partial<Omit<Extract<Field, { type: "number" }>, "key" | "label" | "type">> = {}) => ({ type: "number", key, label, ...o }) as const,
  boolean: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "boolean", key, label, ...o }) as const,
  select: <K extends string>(key: K, label: string, options: { value: string; label: string }[], o: { help?: string } = {}) =>
    ({ type: "select", key, label, options, ...o }) as const,
  color: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "color", key, label, ...o }) as const,
  image: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "image", key, label, ...o }) as const,
  images: <K extends string>(key: K, label: string, o: Partial<Omit<Extract<Field, { type: "images" }>, "key" | "label" | "type">> = {}) => ({ type: "images", key, label, ...o }) as const,
  link: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "link", key, label, ...o }) as const,
  icon: <K extends string>(key: K, label: string, o: { help?: string } = {}) => ({ type: "icon", key, label, ...o }) as const,
  repeater: <K extends string, Sub extends Field[]>(key: K, label: string, fields: [...Sub], o: Partial<Omit<Extract<Field, { type: "repeater" }>, "fields" | "key" | "label" | "type">> = {}) =>
    ({ type: "repeater", key, label, fields, ...o }) as const,
};
