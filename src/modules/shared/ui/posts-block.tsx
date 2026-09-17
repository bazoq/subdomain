import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { TenantPost } from "@/generated/prisma/client";
import type { SiteContext } from "@/templates/types";
import { Container, Img, SectionHeading } from "@/templates/ui";
import { t, ui, type LocalizedString } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";
import { getPosts } from "@/modules/shared/queries";

type HeadingData = { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };

export function PostCard({ ctx, post, variant = "card", light, className }: { ctx: SiteContext; post: TenantPost; variant?: "card" | "horizontal"; light?: boolean; className?: string }) {
  const href = `/blog/${post.slug}`;
  const title = t(post.title as LocalizedString, ctx.lang);
  const excerpt = t(post.excerpt as LocalizedString, ctx.lang);
  const date = post.publishedAt ? formatDate(post.publishedAt) : "";
  return (
    <article className={cn("t-card group flex h-full overflow-hidden", variant === "horizontal" ? "flex-col sm:flex-row" : "flex-col", light && "border-white/10 bg-white/5", className)}>
      <Link href={href} className={cn("block overflow-hidden", variant === "horizontal" && "sm:w-64 sm:shrink-0")}>
        <Img src={post.coverUrl ?? ""} alt={title} className={cn("w-full object-cover transition duration-500 group-hover:scale-105", variant === "horizontal" ? "aspect-video h-full sm:aspect-auto" : "aspect-[16/10]")} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {date ? (
          <time dateTime={post.publishedAt?.toISOString()} className={cn("flex items-center gap-1.5 text-xs", light ? "text-t-dark-fg/60" : "text-t-muted-fg")}>
            <CalendarDays className="size-3.5" /> {date}
          </time>
        ) : null}
        <h3 className={cn("font-heading mt-2 text-lg font-bold leading-snug", light ? "text-t-dark-fg" : "text-t-fg")}>
          <Link href={href} className="hover:text-t-primary">
            {title}
          </Link>
        </h3>
        {excerpt ? <p className={cn("mt-2 line-clamp-3 text-sm", light ? "text-t-dark-fg/70" : "text-t-muted-fg")}>{excerpt}</p> : null}
        <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-t-primary hover:underline">
          {t(ui.readMore, ctx.lang)} <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </article>
  );
}

export async function PostsBlock({
  ctx,
  take = 3,
  columns = 3,
  heading,
  light,
  className,
  id = "blog",
  bare,
  showAllLink = true,
}: {
  ctx: SiteContext;
  take?: number;
  columns?: 2 | 3 | 4;
  heading?: HeadingData;
  light?: boolean;
  className?: string;
  id?: string;
  bare?: boolean;
  showAllLink?: boolean;
}) {
  const rows = await getPosts(ctx.tenant.id, take);
  if (!rows.length) return null;
  const h = heading ?? ((ctx.sections.posts?.data as HeadingData | undefined) ?? { eyebrow: "Blog", title: ctx.lang === "ur" ? { en: "Latest news", ur: "تازہ خبریں" } : { en: "Latest news & updates" } });
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const body = (
    <div className={cn("grid gap-6", cols)}>
      {rows.map((p) => (
        <PostCard key={p.id} ctx={ctx} post={p} light={light} />
      ))}
    </div>
  );
  if (bare) return <div className={className}>{body}</div>;
  return (
    <section id={id} className={cn("py-16 sm:py-20", light && "bg-t-dark text-t-dark-fg", className)}>
      <Container>
        <SectionHeading eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} lang={ctx.lang} light={light} />
        {body}
        {showAllLink ? (
          <div className="mt-10 text-center">
            <Link href="/blog" className={cn("t-btn", light ? "t-btn-outline text-t-dark-fg" : "t-btn-outline text-t-primary")}>
              {t(ui.blog, ctx.lang)} <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
