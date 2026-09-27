import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentTenant, type TenantContext } from "@/server/tenant";
import { buildSiteContext } from "@/server/site-content";
import type { SiteContext } from "@/templates/types";
import { isLang, resolveLang, type Lang } from "@/lib/i18n";

export const LANG_COOKIE = "sf_lang";

/**
 * Effective language of the current tenant request. The visitor's `sf_lang` cookie wins, then the
 * tenant's `settings.languages.defaultLang`; Urdu is only honoured when the tenant has enabled it
 * (`resolveLang`). Off a tenant host (no tenant resolved) only the cookie counts. `getCurrentTenant`
 * is request-cached, so callers that already resolved the tenant pay no extra database round trip.
 */
export const currentLang = cache(async (): Promise<Lang> => {
  const [jar, tc] = await Promise.all([cookies(), getCurrentTenant()]);
  const cookie = jar.get(LANG_COOKIE)?.value;
  if (!tc) return isLang(cookie) ? cookie : "en";
  return resolveLang(cookie, tc.settings.languages);
});

/** Tenant + template + content for the current request. Calls notFound() for unknown hosts. */
export const getSiteContext = cache(async (): Promise<SiteContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  const ctx = await buildSiteContext(tc, await currentLang());
  if (!ctx) notFound();
  return ctx;
});

export const requireTenant = cache(async (): Promise<TenantContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  return tc;
});
