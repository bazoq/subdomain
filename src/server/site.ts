import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentTenant, type TenantContext } from "@/server/tenant";
import { buildSiteContext } from "@/server/site-content";
import type { SiteContext } from "@/templates/types";
import type { Lang } from "@/lib/i18n";

export const LANG_COOKIE = "sf_lang";

export const currentLang = cache(async (): Promise<Lang> => {
  const jar = await cookies();
  return jar.get(LANG_COOKIE)?.value === "ur" ? "ur" : "en";
});

/** Tenant + template + content for the current request. Calls notFound() for unknown hosts. */
export const getSiteContext = cache(async (): Promise<SiteContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  const lang = await currentLang();
  const ctx = await buildSiteContext(tc, tc.settings.languages.urduEnabled ? lang : "en");
  if (!ctx) notFound();
  return ctx;
});

export const requireTenant = cache(async (): Promise<TenantContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  return tc;
});
