import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getSiteContext } from "@/server/site";
import { RichText } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { getProduct, getRelatedProducts } from "@/modules/ecommerce/queries";
import { AddToCart, EcommerceProviders, ProductGallery, ProductGrid, sui, toStoreCtx } from "@/modules/ecommerce/ui";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const [ctx, { slug }] = await Promise.all([getSiteContext(), params]);
  const product = await getProduct(ctx.tenant.id, slug);
  if (!product) return {};
  const name = t(product.name, ctx.lang);
  return {
    title: product.seo.title || `${name} · ${ctx.tenant.name}`,
    description: product.seo.description || t(product.shortDesc, ctx.lang) || undefined,
    openGraph: product.images[0] ? { images: [{ url: product.images[0] }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const [ctx, { slug }] = await Promise.all([getSiteContext(), params]);
  const product = await getProduct(ctx.tenant.id, slug);
  if (!product) notFound();
  const related = await getRelatedProducts(ctx.tenant.id, product, 4);
  const lang = ctx.lang;
  const name = t(product.name, lang);
  const isMedical = ctx.category.modules.includes("medical");
  const images = [...product.images, ...product.variants.map((v) => v.imageUrl).filter((x): x is string => !!x)];
  const medical = [
    [t(sui.genericName, lang), product.genericName],
    [t(sui.manufacturer, lang), product.manufacturer],
    [t(sui.dosageForm, lang), product.dosageForm],
    [t(sui.strength, lang), product.strength],
  ].filter((r): r is [string, string] => !!r[1]);
  const store = toStoreCtx(ctx);

  return (
    <EcommerceProviders ctx={ctx}>
      <div className="t-container py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-t-muted-fg">
          <Link href="/" className="hover:text-t-fg">
            {t(ui.home, lang)}
          </Link>
          <ChevronRight className="size-3 rtl:rotate-180" />
          <Link href="/shop" className="hover:text-t-fg">
            {t(ui.shop, lang)}
          </Link>
          {product.category ? (
            <>
              <ChevronRight className="size-3 rtl:rotate-180" />
              <Link href={`/shop/c/${product.category.slug}`} className="hover:text-t-fg">
                {t(product.category.name, lang)}
              </Link>
            </>
          ) : null}
          <ChevronRight className="size-3 rtl:rotate-180" />
          <span className="text-t-fg">{name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery images={images} alt={name} />
          <div>
            {product.category ? (
              <Link href={`/shop/c/${product.category.slug}`} className="t-eyebrow">
                {t(product.category.name, lang)}
              </Link>
            ) : null}
            <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
            {product.sku ? (
              <p className="mt-1 text-xs text-t-muted-fg">
                {t(sui.sku, lang)}: {product.sku}
              </p>
            ) : null}
            {t(product.shortDesc, lang) ? <p className="mt-3 text-t-muted-fg">{t(product.shortDesc, lang)}</p> : null}
            <AddToCart product={product} ctx={store} className="mt-6" />

            {product.attributes.length ? (
              <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-t-border pt-5 text-sm">
                {product.attributes.map((a) => (
                  <div key={a.key} className="contents">
                    <dt className="text-t-muted-fg">{a.key}</dt>
                    <dd className="font-medium">{a.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {product.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-t-muted px-2.5 py-0.5 text-xs text-t-muted-fg">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {t(product.description, lang) ? (
            <section className="lg:col-span-2">
              <h2 className="font-heading text-xl font-semibold">{t(sui.description, lang)}</h2>
              <RichText value={product.description} lang={lang} className="mt-3" />
            </section>
          ) : null}
          <div className="space-y-8">
            {isMedical && medical.length ? (
              <section className="t-card p-5">
                <h2 className="font-heading text-lg font-semibold">{t(sui.medicalInfo, lang)}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {medical.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-t-muted-fg">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {product.specs.length ? (
              <section className="t-card overflow-hidden">
                <h2 className="font-heading border-b border-t-border px-5 py-3 text-lg font-semibold">{t(sui.specifications, lang)}</h2>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-t-border">
                    {product.specs.map((s) => (
                      <tr key={s.key}>
                        <th scope="row" className="w-2/5 px-5 py-2 text-left font-normal text-t-muted-fg rtl:text-right">
                          {s.key}
                        </th>
                        <td className="px-5 py-2 font-medium">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        </div>

        {related.length ? (
          <section className="mt-16">
            <h2 className="font-heading mb-6 text-2xl font-bold">{t(sui.relatedProducts, lang)}</h2>
            <ProductGrid products={related} ctx={ctx} showQuickAdd />
          </section>
        ) : null}
      </div>
    </EcommerceProviders>
  );
}
