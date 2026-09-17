import "server-only";
import { db } from "@/server/db";
import { t, type LocalizedString } from "@/lib/i18n";

/** Options for the menu item form: categories + modifier groups (tenant-scoped). */
export async function loadMenuFormOptions(tenantId: string) {
  const [cats, groups] = await Promise.all([
    db.menuCategory.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.modifierGroup.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" }, include: { modifiers: { select: { name: true, isActive: true } } } }),
  ]);
  return {
    categories: cats.map((c) => ({ id: c.id, name: t(c.name as LocalizedString) })),
    groups: groups.map((g) => ({
      id: g.id,
      name: t(g.name as LocalizedString),
      summary: `${g.required ? "Required" : "Optional"} · pick ${g.minSelect}–${g.maxSelect} · ${g.modifiers
        .filter((m) => m.isActive)
        .map((m) => t(m.name as LocalizedString))
        .slice(0, 4)
        .join(", ")}${g.modifiers.length > 4 ? "…" : ""}`,
    })),
  };
}
