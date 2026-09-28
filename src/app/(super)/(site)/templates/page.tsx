import type { Metadata } from "next";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";
import { getGalleryMetas } from "@/server/super/gallery";
import { toCardData } from "@/components/super-site/template-card";
import { TemplateGallery } from "@/components/super-site/template-gallery";
import { Container, Glow, GridTexture, SectionHeading } from "@/components/super-site/ui";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/components/super-site/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: `All ${TOTAL_TEMPLATES} website templates`,
  description: `Browse ${TOTAL_TEMPLATES} ready-made website templates for ${CATEGORIES.length} kinds of Pakistani business — every one with a live demo, cash on delivery, WhatsApp and Urdu built in.`,
  path: "/templates",
});

/** How many style chips to show — the catalog has ~130 distinct style tags, most used once. */
const STYLE_CHIPS = 14;

export default async function TemplatesIndex({ searchParams }: { searchParams: Promise<{ style?: string; category?: string; q?: string }> }) {
  const { style: rawStyle, category: rawCategory, q } = await searchParams;
  const all = await getGalleryMetas();

  const styleCount = new Map<string, number>();
  for (const t of all) for (const s of t.style) styleCount.set(s, (styleCount.get(s) ?? 0) + 1);
  const styles = [...styleCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, STYLE_CHIPS)
    .map(([s]) => s);
  const categories = CATEGORIES.map((c) => ({ key: c.key, name: c.name, count: all.filter((t) => t.category === c.key).length })).filter((c) => c.count > 0);

  return (
    <div className="relative isolate">
      <GridTexture />
      <Glow className="left-1/2 top-[-16rem] h-[32rem] w-[60rem] -translate-x-1/2" />
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
      <Container className="pb-24 pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          eyebrow="Template gallery"
          title={
            <>
              {all.length} designs, <em className="text-gold-gradient">one</em> for you
            </>
          }
          lead="Every picture is the template's live demo — hover a card to scroll through it. Filter by your industry, then open the demo and click around, admin panel included."
        />
        <div className="mt-12">
          <TemplateGallery
            templates={all.map(toCardData)}
            categories={categories}
            styles={styles}
            initial={{
              category: rawCategory && categories.some((c) => c.key === rawCategory) ? rawCategory : undefined,
              style: rawStyle && styleCount.has(rawStyle) ? rawStyle : undefined,
              q: q?.slice(0, 60),
            }}
          />
        </div>
      </Container>
    </div>
  );
}
