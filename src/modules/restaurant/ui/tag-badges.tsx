import { Flame, Leaf, Sparkles, Star } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { rs } from "../strings";

const TAG_STYLES: Record<string, { cls: string; Icon: typeof Flame; label: keyof typeof rs }> = {
  spicy: { cls: "bg-red-600 text-white", Icon: Flame, label: "spicy" },
  veg: { cls: "bg-emerald-600 text-white", Icon: Leaf, label: "veg" },
  bestseller: { cls: "bg-t-accent text-t-accent-fg", Icon: Star, label: "bestseller" },
  new: { cls: "bg-t-primary text-t-primary-fg", Icon: Sparkles, label: "new" },
};

/** Small pill badges for item tags (spicy / veg / bestseller / new). */
export function TagBadges({ tags, lang, className, compact }: { tags: string[]; lang: Lang; className?: string; compact?: boolean }) {
  const known = tags.filter((x) => x in TAG_STYLES);
  if (!known.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {known.map((tag) => {
        const s = TAG_STYLES[tag];
        return (
          <span key={tag} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm", s.cls)} title={t(rs[s.label], lang)}>
            <s.Icon className="size-3" />
            {compact ? null : t(rs[s.label], lang)}
          </span>
        );
      })}
    </div>
  );
}
