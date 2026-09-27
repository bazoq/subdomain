import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/server/db";
import { parseSettings, type TenantSettings } from "@/lib/tenant-settings";
import { getCategory, type BusinessCategory } from "@/lib/categories";
import type { Tenant } from "@/generated/prisma/client";

export interface TenantContext {
  tenant: Tenant;
  settings: TenantSettings;
  category: BusinessCategory;
  host: string;
}

/** Resolve the tenant for a hostname (no caching across requests; Vercel functions are short-lived). */
export const getTenantByHost = cache(async (host: string): Promise<TenantContext | null> => {
  const hostname = host.toLowerCase().split(":")[0];
  const domain = await db.domain.findUnique({ where: { hostname }, include: { tenant: true } });
  if (!domain) return null;
  const category = getCategory(domain.tenant.category);
  if (!category) return null;
  return {
    tenant: domain.tenant,
    settings: parseSettings(domain.tenant.settings),
    category,
    host: hostname,
  };
});

const HOSTNAME_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

/**
 * Host of the current request as forwarded by proxy.ts (`x-tenant-host` / `x-request-host` are
 * stripped from inbound requests and re-set there, so they are trustworthy). The raw `Host`
 * header is only a fallback for code paths the proxy did not cover; anything that is not a
 * plain hostname collapses to "" so it can never reach a database lookup.
 */
export async function currentHost(): Promise<string> {
  const h = await headers();
  const raw = (h.get("x-tenant-host") ?? h.get("x-request-host") ?? h.get("host") ?? "").trim().toLowerCase();
  const host = raw.replace(/:\d{1,5}$/, "").replace(/\.$/, "");
  return HOSTNAME_RE.test(host) && host.length <= 253 ? host : "";
}

/** Resolve the tenant from the current request (server components / actions / route handlers). */
export const getCurrentTenant = cache(async (): Promise<TenantContext | null> => {
  const host = await currentHost();
  if (!host) return null;
  return getTenantByHost(host);
});

export async function getTenantById(id: string): Promise<TenantContext | null> {
  const tenant = await db.tenant.findUnique({ where: { id }, include: { domains: true } });
  if (!tenant) return null;
  const category = getCategory(tenant.category);
  if (!category) return null;
  const primary = tenant.domains.find((d) => d.isPrimary) ?? tenant.domains[0];
  return { tenant, settings: parseSettings(tenant.settings), category, host: primary?.hostname ?? "" };
}
