/**
 * Seed helper: provision SiteSection rows for a tenant from a template's defaults.
 * The logic lives in src/server/super/provision.ts so the super admin's
 * createTenant action and this seed share one implementation.
 */
export { provisionTenantSections, migrateTenantSections, sectionRowsForTemplate } from "@/server/super/provision";
