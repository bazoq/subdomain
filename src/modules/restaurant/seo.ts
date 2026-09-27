import type { TenantContext } from "@/server/tenant";
import { businessId, tenantUrl, type JsonLdObject } from "@/server/site-seo";
import { t, ui, type Lang } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/utils";
import { itemStartingPrice, type MenuCategoryDto } from "./types";

function compact(obj: Record<string, unknown>): JsonLdObject {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));
}

/**
 * schema.org Menu for `/menu`: one MenuSection per category, each item with its starting PKR price. Linked back to the
 * business node the site layout already emits (`localBusinessJsonLd`), so the graph reads Restaurant → hasMenu → Menu.
 */
export function menuJsonLd(tc: TenantContext, categories: MenuCategoryDto[], lang: Lang, host: string = tc.host): JsonLdObject {
  const url = tenantUrl(tc, "/menu", host);
  const sections = categories
    .filter((c) => c.items.length > 0)
    .map((c) =>
      compact({
        "@type": "MenuSection",
        name: t(c.name, lang),
        image: safeExternalUrl(c.imageUrl) ?? undefined,
        hasMenuItem: c.items.map((i) =>
          compact({
            "@type": "MenuItem",
            name: t(i.name, lang),
            description: t(i.description, lang).trim().slice(0, 300) || undefined,
            image: safeExternalUrl(i.imageUrl) ?? undefined,
            offers: { "@type": "Offer", price: itemStartingPrice(i), priceCurrency: "PKR", availability: "https://schema.org/InStock" },
          }),
        ),
      }),
    );
  return compact({
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${url}#menu`,
    url,
    name: `${tc.tenant.name} — ${t(ui.menu, lang)}`,
    inLanguage: lang,
    hasMenuSection: sections,
    provider: { "@id": businessId(tc, host) },
  });
}
