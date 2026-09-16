import type { ReactNode } from "react";
import type { Field, InferFields } from "@/templates/fields";
import type { CategoryKey } from "@/lib/categories";
import type { Lang, LocalizedString } from "@/lib/i18n";
import type { TenantSettings } from "@/lib/tenant-settings";
import type { BusinessCategory } from "@/lib/categories";
import type { SitePage, Tenant } from "@/generated/prisma/client";

/* ---------- sections ---------- */
export interface SectionDefinition<Fs extends Field[] = Field[]> {
  key: string;
  label: string;
  description?: string;
  fields: Fs;
  defaults: InferFields<Fs>;
  /** false for structural sections (hero, footer) that must always render */
  canDisable?: boolean;
}

export function defineSection<const Fs extends Field[]>(def: SectionDefinition<Fs>): SectionDefinition<Fs> {
  return { canDisable: true, ...def };
}

export type SectionContent<S> = S extends SectionDefinition<infer Fs> ? InferFields<Fs> : never;

/* ---------- theme ---------- */
export interface TemplateTheme {
  colors: {
    primary: string;
    primaryFg: string;
    secondary: string;
    secondaryFg: string;
    accent: string;
    accentFg: string;
    bg: string;
    fg: string;
    muted: string;
    mutedFg: string;
    card: string;
    border: string;
  };
  fonts: {
    /** Google Fonts family names, e.g. "Playfair Display" */
    heading: string;
    body: string;
    /** optional Urdu font (defaults to Noto Nastaliq Urdu) */
    urdu?: string;
    headingWeights?: number[];
    bodyWeights?: number[];
  };
  radius: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** optional dark surface for headers/footers */
  dark?: string;
  darkFg?: string;
}

/* ---------- navigation ---------- */
export interface NavItem {
  label: LocalizedString;
  href: string;
  children?: NavItem[];
}

/* ---------- template meta (static, importable by super site) ---------- */
export interface TemplateMeta {
  id: string; // "pizza-01"
  category: CategoryKey;
  name: string; // "Slice House"
  tagline: string;
  description: string;
  /** feature bullets shown on super site and in category blogs */
  features: string[];
  style: string[]; // ["dark", "bold", "playful"]
  theme: TemplateTheme;
  sections: SectionDefinition[];
  nav: NavItem[];
  /** default settings overrides for freshly created tenants (e.g. dineIn true) */
  defaultSettings?: Partial<TenantSettings>;
  /** the demo tenant name/slug used when seeding */
  demo: { name: string; city: string };
}

/* ---------- runtime context passed to template components ---------- */
export interface SectionState<T = Record<string, unknown>> {
  enabled: boolean;
  sortOrder: number;
  data: T;
}

export interface SiteContext {
  tenant: Tenant;
  settings: TenantSettings;
  category: BusinessCategory;
  host: string;
  lang: Lang;
  dir: "ltr" | "rtl";
  template: TemplateMeta;
  /** keyed by section key, already merged with defaults and validated */
  sections: Record<string, SectionState>;
  /** enabled sections in display order */
  orderedSections: { key: string; data: Record<string, unknown> }[];
  nav: NavItem[];
  pages: Pick<SitePage, "slug" | "title" | "showInNav">[];
  /** path prefix for language switch links */
  langHref: (lang: Lang) => string;
}

export interface TemplateLayoutProps {
  ctx: SiteContext;
  children: ReactNode;
}

export interface TemplatePageProps {
  ctx: SiteContext;
}

export interface TemplateComponents {
  Layout: (props: TemplateLayoutProps) => ReactNode | Promise<ReactNode>;
  Home: (props: TemplatePageProps) => ReactNode | Promise<ReactNode>;
}

export interface TemplateModule {
  meta: TemplateMeta;
  components: TemplateComponents;
}

/** Helper for typed access to a section's data inside a template. */
export function section<S extends SectionDefinition>(ctx: SiteContext, def: S): (SectionContent<S> & { __enabled: boolean }) | null {
  const s = ctx.sections[def.key];
  if (!s || !s.enabled) return null;
  return { ...(s.data as SectionContent<S>), __enabled: true };
}
