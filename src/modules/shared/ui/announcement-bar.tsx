import type { SiteContext } from "@/templates/types";
import { AnnouncementBarClient } from "@/modules/shared/ui/announcement-bar-client";

/** Dismissible top bar from Settings > Announcement. Renders nothing when disabled. */
export function AnnouncementBar({ ctx, className, variant = "primary" }: { ctx: SiteContext; className?: string; variant?: "primary" | "accent" | "dark" }) {
  const a = ctx.settings.announcement;
  const text = ctx.lang === "ur" && a.textUr?.trim() ? a.textUr : a.text;
  if (!a.enabled || !text?.trim()) return null;
  return <AnnouncementBarClient storageKey={`sf_ann:${ctx.tenant.id}:${text.length}:${a.link ?? ""}`} text={text} link={a.link} className={className} variant={variant} />;
}
