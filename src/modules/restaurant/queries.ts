import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { LocalizedString } from "@/lib/i18n";
import type { Prisma } from "@/generated/prisma/client";
import { parseSizes, type DeliveryZoneDto, type MenuCategoryDto, type MenuItemDto, type MenuModifierGroupDto } from "./types";

/** Public, tenant-scoped reads for the restaurant storefront. All cached per request. */

export const itemInclude = {
  modifierGroups: {
    include: { group: { include: { modifiers: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } } },
  },
} satisfies Prisma.MenuItemInclude;

type ItemRow = Prisma.MenuItemGetPayload<{ include: typeof itemInclude }>;

function asLocalized(v: unknown): LocalizedString {
  if (v && typeof v === "object" && "en" in v) return v as LocalizedString;
  if (typeof v === "string") return { en: v };
  return { en: "" };
}

function toGroupDto(g: ItemRow["modifierGroups"][number]["group"]): MenuModifierGroupDto {
  return {
    id: g.id,
    name: asLocalized(g.name),
    minSelect: g.minSelect,
    maxSelect: g.maxSelect,
    required: g.required,
    modifiers: g.modifiers.map((m) => ({ id: m.id, name: asLocalized(m.name), price: m.price })),
  };
}

export function toMenuItemDto(row: ItemRow): MenuItemDto {
  return {
    id: row.id,
    slug: row.slug,
    name: asLocalized(row.name),
    description: asLocalized(row.description),
    price: row.price,
    sizes: parseSizes(row.sizes),
    imageUrl: row.imageUrl,
    tags: row.tags,
    isFeatured: row.isFeatured,
    categoryId: row.categoryId,
    modifierGroups: row.modifierGroups
      .map((mg) => mg.group)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toGroupDto),
  };
}

/** Active categories (ordered) with their available items, each with modifier groups + active modifiers. */
export const getMenu = cache(async (tenantId: string): Promise<MenuCategoryDto[]> => {
  const [cats, items] = await Promise.all([
    db.menuCategory.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.menuItem.findMany({ where: { tenantId, isAvailable: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: itemInclude }),
  ]);
  const byCat = new Map<string, MenuItemDto[]>();
  const orphans: MenuItemDto[] = [];
  const active = new Set(cats.map((c) => c.id));
  for (const row of items) {
    const dto = toMenuItemDto(row);
    if (row.categoryId && active.has(row.categoryId)) {
      const list = byCat.get(row.categoryId) ?? [];
      list.push(dto);
      byCat.set(row.categoryId, list);
    } else orphans.push(dto);
  }
  const out: MenuCategoryDto[] = cats
    .map((c) => ({ id: c.id, slug: c.slug, name: asLocalized(c.name), imageUrl: c.imageUrl, items: byCat.get(c.id) ?? [] }))
    .filter((c) => c.items.length > 0);
  if (orphans.length) out.push({ id: "_other", slug: "more", name: { en: "More", ur: "مزید" }, imageUrl: null, items: orphans });
  return out;
});

export const getMenuItem = cache(async (tenantId: string, slug: string): Promise<MenuItemDto | null> => {
  const row = await db.menuItem.findFirst({ where: { tenantId, slug, isAvailable: true }, include: itemInclude });
  return row ? toMenuItemDto(row) : null;
});

export const getFeaturedItems = cache(async (tenantId: string, take = 8): Promise<MenuItemDto[]> => {
  const rows = await db.menuItem.findMany({
    where: { tenantId, isAvailable: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    include: itemInclude,
  });
  return rows.map(toMenuItemDto);
});

export const getDeliveryZones = cache(async (tenantId: string): Promise<DeliveryZoneDto[]> => {
  const rows = await db.deliveryZone.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((z) => ({ id: z.id, name: z.name, fee: z.fee, minOrder: z.minOrder, etaMins: z.etaMins }));
});

export const getModifierGroups = cache(async (tenantId: string): Promise<MenuModifierGroupDto[]> => {
  const rows = await db.modifierGroup.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { modifiers: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });
  return rows.map(toGroupDto);
});
