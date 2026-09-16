import { brand } from "@/config/brand";
import { CATEGORIES, TOTAL_TEMPLATES } from "@/lib/categories";

export default function SuperHomePlaceholder() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="font-heading text-5xl font-bold">{brand.name}</h1>
      <p className="mt-4 text-lg text-slate-600">{brand.tagline}</p>
      <p className="mt-2 text-sm text-slate-500">
        {TOTAL_TEMPLATES} templates across {CATEGORIES.length} business categories. Full marketing site coming in the
        super-site phase.
      </p>
    </main>
  );
}
