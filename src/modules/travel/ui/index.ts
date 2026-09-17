/**
 * Travel storefront kit. Theme-agnostic; every component takes `ctx: SiteContext`.
 * Server: PackageCard, PackageGrid, PackageDetail, PackageSearch, FeaturedPackages, UmrahHighlights.
 * Client: PackageTabs, ItineraryAccordion, PackageGallery, BookingForm.
 * FeaturedPackages / UmrahHighlights fetch data (server-only) — import this barrel from server components only.
 */
export { PackageCard } from "./package-card";
export { PackageGrid, PackagesPagination } from "./package-grid";
export { PackageTabs } from "./package-tabs";
export { PackageDetail } from "./package-detail";
export { ItineraryAccordion } from "./itinerary-accordion";
export { PackageGallery } from "./gallery";
export { BookingForm } from "./booking-form";
export { PackageSearch } from "./package-search";
export { FeaturedPackages } from "./featured-packages";
export { UmrahHighlights } from "./umrah-highlights";
export { kindLabel, durationText, packagesHref, parseItinerary, parseLocalizedList, parseDepartures } from "../helpers";
export { ts as travelStrings } from "../strings";
