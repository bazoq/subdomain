import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { getGalleryMetas } from "@/server/super/gallery";
import { TemplateCard } from "@/components/super-site/template-card";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/components/super-site/seo";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `All ${TOTAL_TEMPLATES} website templates`,
  description: `Browse ${TOTAL_TEMPLATES} ready-made website templates for ${CATEGORIES.length} kinds of Pakistani business — every one with a live demo, cash on delivery, WhatsApp and Urdu built in.`,
  path: "/templates",
});

/** How many style chips to show — the catalog has ~130 distinct style tags, most used once. */
const STYLE_CHIPS = 12;

export default async function TemplatesIndex({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const { style: rawStyle } = await searchParams;
  const all = await getGalleryMetas();

  const styleCount = new Map<string, number>();
  for (const t of all) for (const s of t.style) styleCount.set(s, (styleCount.get(s) ?? 0) + 1);
  const styles = [...styleCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, STYLE_CHIPS)
    .map(([s]) => s);
  const style = rawStyle && styleCount.has(rawStyle) ? rawStyle : undefined;
  const filtered = style ? all.filter((t) => t.style.includes(style)) : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
          ]),
          itemListJsonLd(
            "Website template categories",
            CATEGORIES.map((c) => ({ name: `${c.name} website templates`, path: `/templates/${c.key}` })),
          ),
        ]}
      />
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Templates</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">
          {all.length} designs across {CATEGORIES.length} industries
        </h1>
        <p className="mt-3 text-slate-600">Every template ships with the full feature set for its business type. Click any card for details and a live demo, and quote its number (for example #901) when you order.</p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter by style">
        <Link href="/templates" aria-current={!style ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 text-sm", !style ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
          All styles
        </Link>
        {styles.map((s) => (
          <Link
            key={s}
            href={`/templates?style=${encodeURIComponent(s)}`}
            aria-current={style === s ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1.5 text-sm capitalize", style === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}
          >
            {s} <span className="text-xs opacity-70">({styleCount.get(s)})</span>
          </Link>
        ))}
      </nav>
      {style ? (
        <p className="mt-3 text-sm text-slate-500" role="status">
          Showing {filtered.length} template{filtered.length === 1 ? "" : "s"} tagged “{style}”.{" "}
          <Link href="/templates" className="font-semibold text-brand-700 hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {CATEGORIES.map((c) => {
        const list = filtered.filter((t) => t.category === c.key);
        if (!list.length) return null;
        return (
          <section key={c.key} id={c.key} className="mt-14 scroll-mt-24" aria-labelledby={`cat-${c.key}`}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id={`cat-${c.key}`} className="font-heading text-2xl font-bold text-slate-900">
                  {c.name}
                </h2>
                <p className="text-sm text-slate-500">{c.description}</p>
              </div>
              <Link href={`/templates/${c.key}`} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
                Category page<span className="sr-only">: {c.name}</span>
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((t) => (
                <TemplateCard key={t.id} meta={t} categoryName={c.name} />
              ))}
            </div>
          </section>
        );
      })}
      {filtered.length === 0 ? <p className="mt-12 rounded-xl border border-dashed p-10 text-center text-slate-500">No templates match this filter yet.</p> : null}
    </div>
  );
}
