import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { TEMPLATES } from "@/templates/registry";
import { TemplateCard } from "@/components/super-site/template-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Templates", description: `Browse ${TOTAL_TEMPLATES} website templates for Pakistani businesses.` };

export default async function TemplatesIndex({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const { style } = await searchParams;
  const styles = Array.from(new Set(TEMPLATES.flatMap((t) => t.style))).sort();
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Templates</p>
        <h1 className="font-heading mt-2 text-4xl font-bold text-slate-900">{TOTAL_TEMPLATES} designs across {CATEGORIES.length} industries</h1>
        <p className="mt-3 text-slate-600">Every template ships with the full feature set for its business type. Click any card for details and a live demo.</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/templates" className={cn("rounded-full border px-3 py-1.5 text-sm", !style ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
          All styles
        </Link>
        {styles.map((s) => (
          <Link key={s} href={`/templates?style=${s}`} className={cn("rounded-full border px-3 py-1.5 text-sm capitalize", style === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
            {s}
          </Link>
        ))}
      </div>

      {CATEGORIES.map((c) => {
        const list = TEMPLATES.filter((t) => t.category === c.key && (!style || t.style.includes(style)));
        if (!list.length) return null;
        return (
          <section key={c.key} id={c.key} className="mt-14 scroll-mt-24">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900">{c.name}</h2>
                <p className="text-sm text-slate-500">{c.description}</p>
              </div>
              <Link href={`/templates/${c.key}`} className="text-sm font-semibold text-brand-700 hover:underline">
                Category page
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
      {TEMPLATES.length === 0 ? <p className="mt-12 rounded-xl border border-dashed p-10 text-center text-slate-500">Templates are being generated.</p> : null}
    </div>
  );
}
