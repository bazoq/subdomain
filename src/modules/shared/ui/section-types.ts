import type { LocalizedString } from "@/lib/i18n";

/** Explicit shapes of the shared section definitions in `@/templates/shared/sections`. */
export type LinkData = { label: LocalizedString; href: string };

export type HeadingData = { eyebrow?: LocalizedString | string; title?: LocalizedString; subtitle?: LocalizedString };
export type StatsData = { items: { value: string; label: LocalizedString }[] };
export type FeaturesData = HeadingData & { items: { icon: string; title: LocalizedString; text: LocalizedString }[] };
export type ProcessData = HeadingData & { steps: { title: LocalizedString; text: LocalizedString; icon: string }[] };
export type CtaData = { title: LocalizedString; text: LocalizedString; cta: LinkData; image: string };
export type AboutData = HeadingData & { body: LocalizedString; image: string; highlights: { text: LocalizedString; icon: string }[]; cta: LinkData };
export type BrandsData = { title: LocalizedString; logos: { name: string; image: string }[] };
export type PromoData = { text: LocalizedString; code: string; cta: LinkData; bg: string };
export type FooterData = { about: LocalizedString; columns: { title: LocalizedString; links: { label: LocalizedString; href: string }[] }[]; bottomNote: string };
export type ContactData = HeadingData & { showForm?: boolean; showMap?: boolean };
export type GalleryHeadingData = { eyebrow?: LocalizedString | string; title?: LocalizedString; album?: string };
export type HeroData = { eyebrow?: LocalizedString | string; title?: LocalizedString; subtitle?: LocalizedString; primaryCta?: LinkData; secondaryCta?: LinkData; image?: string };
