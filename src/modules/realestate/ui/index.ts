/**
 * Real-estate storefront kit. Theme-agnostic; every component takes `ctx: SiteContext`.
 * Server: PropertyCard, PropertyGrid, PropertyDetail (async, resolves agent), FeaturedProperties.
 * Client: PropertySearch, PropertyGallery, InquiryForm.
 * PropertyDetail / FeaturedProperties fetch data (server-only) — import this barrel from server components only.
 */
export { PropertyCard } from "./property-card";
export { PropertyGrid, PropertiesPagination } from "./property-grid";
export { PropertySearch, type PropertySearchValues } from "./property-search";
export { PropertyGallery } from "./gallery";
export { PropertyDetail } from "./property-detail";
export { InquiryForm } from "./inquiry-form";
export { FeaturedProperties } from "./featured-properties";
export { propertyPrice, areaText, purposeLabel, typeLabel, areaUnitLabel, propertiesHref, mapEmbedUrl, videoEmbedUrl } from "../helpers";
export { rs as realestateStrings } from "../strings";
