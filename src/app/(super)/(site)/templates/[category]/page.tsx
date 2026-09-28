import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { galleryTemplatesForCategory } from "@/server/super/gallery";
import { TemplateCard, templateHref, toCardData } from "@/components/super-site/template-card";
import { LeadForm } from "@/components/super-site/lead-form";
import { Container, Eyebrow, Glow, GridTexture, IconByName, Panel } from "@/components/super-site/ui";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/components/super-site/seo";
import { getGuide } from "@/lib/guides";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} website templates (${c.templateCount} designs)`,
    description: `${c.description} ${c.templateCount} ready templates for ${c.plural.toLowerCase()} in Pakistan, each with a live demo and admin panel.`,
    path: `/templates/${c.key}`,
  });
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export default async function CategoryTemplatesPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const list = await galleryTemplatesForCategory(c.key);
  const guide = getGuide(c.key);

  return (
    <div className="relative isolate">
      <GridTexture />
      <Glow className="left-1/2 top-[-16rem] h-[32rem] w-[60rem] -translate-x-1/2" />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Templates", path: "/templates" },
            { name: c.name, path: `/templates/${c.key}` },
          ]),
          itemListJsonLd(
            `${c.name} website templates`,
            list.map((t) => ({ name: `${t.name} (#${t.code})`, path: templateHref(t) })),
          ),
          faqJsonLd(guide.faq),
        ]}
      />
      <Container className="pb-24 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/templates" className="hover:text-zinc-200">
                Templates
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-zinc-200">
              {c.name}
            </li>
          </ol>
        </nav>

        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-gold-300 shadow-[0_0_40px_-10px_rgba(226,187,114,0.45)]">
              <IconByName name={c.icon} className="size-6" />
            </span>
            <Eyebrow className="mt-8">{c.plural}</Eyebrow>
            <h1 className="font-display mt-4 text-balance text-5xl leading-[1.02] tracking-tight text-white sm:text-7xl">
              {c.name} <em className="text-gold-gradient">websites</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">{c.description}</p>
            <p className="mt-3 font-urdu text-lg leading-9 text-zinc-500" dir="rtl" lang="ur">
              {c.nameUr}
            </p>
            <p className="mt-6 text-sm text-zinc-500">
              {list.length} designs · template numbers start at <span className="font-mono text-gold-400">#{c.series + 1}</span> — quote the number when you contact us.
            </p>
          </div>
          <Panel as="aside" className="self-start p-7 lg:col-span-5" aria-labelledby="included-title">
            <h2 id="included-title" className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
              In every {c.name.toLowerCase()} template
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-zinc-300">
              {guide.features.slice(0, 6).map((f) => (
                <li key={f} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/blog/${c.key}`} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 hover:text-gold-200">
              Read the full feature guide <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Panel>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <TemplateCard key={t.id} meta={toCardData(t)} categoryName={c.name} priority={i < 3} />
          ))}
          {list.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500 sm:col-span-2 lg:col-span-3">Templates for this category are not published yet. Contact us and we will show you a preview.</p>
          ) : null}
        </div>

        <nav className="mt-20" aria-label="Other industries">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Other industries</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((x) => x.key !== c.key).map((x) => (
              <li key={x.key}>
                <Link href={`/templates/${x.key}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-zinc-400 transition hover:border-white/25 hover:text-zinc-100">
                  <IconByName name={x.icon} className="size-3.5 text-gold-400" /> {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Panel as="section" className="mt-20 grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2" aria-labelledby="want-title">
          <div>
            <Eyebrow>Get started</Eyebrow>
            <h2 id="want-title" className="font-display mt-4 text-4xl leading-tight text-white sm:text-5xl">
              Want one for your {c.name.toLowerCase()}?
            </h2>
            <p className="mt-4 text-zinc-400">Send your details and the template number. We set it up on your domain and hand over the admin login.</p>
          </div>
          <LeadForm defaultCategory={c.key} compact source={`templates/${c.key}`} />
        </Panel>
      </Container>
    </div>
  );
}
