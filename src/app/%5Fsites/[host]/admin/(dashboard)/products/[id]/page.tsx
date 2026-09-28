import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";
import { ProductForm, type ProductFormValue } from "@/components/admin/ecommerce/product-form";
import { asLocalized, asOptions, parseAttributes } from "@/modules/ecommerce/mappers";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireTenantAdmin(), params]);
  const [product, cats] = await Promise.all([
    db.product.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { variants: { orderBy: { id: "asc" } } } }),
    db.productCategory.findMany({ where: { tenantId: ctx.tenant.id }, orderBy: [{ sortOrder: "asc" }] }),
  ]);
  if (!product) notFound();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const categories = cats.map((c) => {
    const parent = c.parentId ? byId.get(c.parentId) : null;
    return { id: c.id, label: parent ? `${asLocalized(parent.name).en} › ${asLocalized(c.name).en}` : asLocalized(c.name).en };
  });
  const { attributes, specs } = parseAttributes(product.attributes);
  const seo = (product.seo && typeof product.seo === "object" && !Array.isArray(product.seo) ? product.seo : {}) as { title?: string; description?: string };

  const initial: ProductFormValue = {
    name: asLocalized(product.name),
    slug: product.slug,
    categoryId: product.categoryId ?? "",
    shortDesc: asLocalized(product.shortDesc),
    description: asLocalized(product.description),
    price: product.price,
    comparePrice: product.comparePrice,
    costPrice: product.costPrice,
    sku: product.sku ?? "",
    stock: product.stock,
    trackStock: product.trackStock,
    images: product.images,
    tags: product.tags,
    attributes,
    specs,
    variants: product.variants.map((v) => ({ id: v.id, name: v.name, options: asOptions(v.options), price: v.price, sku: v.sku ?? "", stock: v.stock, imageUrl: v.imageUrl ?? "", isActive: v.isActive })),
    requiresPrescription: product.requiresPrescription,
    genericName: product.genericName ?? "",
    manufacturer: product.manufacturer ?? "",
    dosageForm: product.dosageForm ?? "",
    strength: product.strength ?? "",
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    seoTitle: typeof seo.title === "string" ? seo.title : "",
    seoDescription: typeof seo.description === "string" ? seo.description : "",
  };

  return (
    <>
      <PageHeader title={initial.name.en || "Edit product"} description={`/shop/${product.slug}`} backHref="/admin/products" />
      <ProductForm
        id={product.id}
        initial={initial}
        categories={categories}
        urduEnabled={ctx.settings.languages.urduEnabled}
        isMedical={ctx.category.modules.includes("medical")}
        lowStockThreshold={ctx.settings.commerce.lowStockThreshold}
      />
    </>
  );
}
