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
const linkSchema = z.object({ label: localizedString, href: z.string().max(500) });

function fieldSchema(f: Field): z.ZodTypeAny {
  switch (f.type) {
    case "text":
      return z.string().max(f.maxLength ?? 500).default("");
    case "localized":
      return localizedString.default({ en: "" });
    case "richtext":
      return localizedString.default({ en: "" });
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
  text: (key: string, label: string, o: Partial<Extract<Field, { type: "text" }>> = {}) => ({ type: "text", key, label, ...o }) as const,
  localized: (key: string, label: string, o: Partial<Extract<Field, { type: "localized" }>> = {}) =>
    ({ type: "localized", key, label, ...o }) as const,
  richtext: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "richtext", key, label, ...o }) as const,
  number: (key: string, label: string, o: Partial<Extract<Field, { type: "number" }>> = {}) => ({ type: "number", key, label, ...o }) as const,
  boolean: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "boolean", key, label, ...o }) as const,
  select: (key: string, label: string, options: { value: string; label: string }[], o: Partial<FieldBase> = {}) =>
    ({ type: "select", key, label, options, ...o }) as const,
  color: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "color", key, label, ...o }) as const,
  image: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "image", key, label, ...o }) as const,
  images: (key: string, label: string, o: Partial<Extract<Field, { type: "images" }>> = {}) => ({ type: "images", key, label, ...o }) as const,
  link: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "link", key, label, ...o }) as const,
  icon: (key: string, label: string, o: Partial<FieldBase> = {}) => ({ type: "icon", key, label, ...o }) as const,
  repeater: <Sub extends Field[]>(key: string, label: string, fields: [...Sub], o: Partial<Omit<Extract<Field, { type: "repeater" }>, "fields">> = {}) =>
    ({ type: "repeater", key, label, fields, ...o }) as const,
};
