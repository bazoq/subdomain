import * as React from "react";
import { cn } from "@/lib/utils";
import type { SocialLinksValue } from "@/modules/shared/content-types";

/* Inline brand glyphs (lucide has no brand icons). */
const GLYPHS: Record<keyof SocialLinksValue, { label: string; path: string }> = {
  facebook: { label: "Facebook", path: "M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6V14h2.8v8h3.1z" },
  instagram: {
    label: "Instagram",
    path: "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3c-2.4 0-2.7 0-3.7.1-3.3.1-5 1.9-5.2 5.2C3 9.3 3 9.6 3 12s0 2.7.1 3.7c.1 3.3 1.9 5 5.2 5.2 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c3.3-.1 5-1.9 5.2-5.2.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-3.3-1.9-5-5.2-5.2C14.7 3 14.4 3 12 3zm0 1.6c2.4 0 2.6 0 3.6.1 2.4.1 3.6 1.3 3.7 3.7.1 1 .1 1.2.1 3.6s0 2.6-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-1 .1-1.2.1-3.6.1s-2.6 0-3.6-.1c-2.4-.1-3.6-1.3-3.7-3.7-.1-1-.1-1.2-.1-3.6s0-2.6.1-3.6c.1-2.4 1.3-3.6 3.7-3.7 1-.1 1.2-.1 3.6-.1z",
  },
  tiktok: { label: "TikTok", path: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.2a7.3 7.3 0 0 0 4.3 1.4V7.5a4.3 4.3 0 0 1-3.2-1.7z" },
  youtube: { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" },
  linkedin: { label: "LinkedIn", path: "M6.9 8.7H3.6V21h3.3V8.7zM5.3 3a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM21 13.5c0-3.5-1.9-5.1-4.4-5.1-2 0-2.9 1.1-3.4 1.9V8.7H9.9V21h3.3v-6.6c0-1.7.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V21H21v-7.5z" },
  twitter: { label: "X (Twitter)", path: "M17.5 3h3l-6.6 7.6L21.7 21h-6.1l-4.8-6.2L5.3 21h-3l7.1-8.1L2 3h6.2l4.3 5.7L17.5 3zm-1.1 16.2h1.7L7 4.7H5.2l11.2 14.5z" },
};

export function SocialLinks({
  social,
  className,
  size = "md",
  light,
  variant = "ghost",
}: {
  social: SocialLinksValue;
  className?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
  variant?: "ghost" | "outline" | "solid";
}) {
  const entries = (Object.keys(GLYPHS) as (keyof SocialLinksValue)[]).filter((k) => social[k]);
  if (!entries.length) return null;
  const dim = size === "sm" ? "size-8 [&_svg]:size-4" : size === "lg" ? "size-11 [&_svg]:size-5" : "size-9 [&_svg]:size-[18px]";
  const skin =
    variant === "solid"
      ? "bg-t-primary text-t-primary-fg hover:brightness-95"
      : variant === "outline"
        ? cn("border", light ? "border-white/30 text-t-dark-fg hover:bg-white/10" : "border-t-border text-t-fg hover:bg-t-muted")
        : light
          ? "text-t-dark-fg/80 hover:bg-white/10 hover:text-t-dark-fg"
          : "text-t-muted-fg hover:bg-t-muted hover:text-t-fg";
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label="Social media">
      {entries.map((k) => (
        <li key={k}>
          <a
            href={social[k]}
            target="_blank"
            rel="noreferrer"
            aria-label={GLYPHS[k].label}
            title={GLYPHS[k].label}
            className={cn("inline-flex items-center justify-center rounded-full transition", dim, skin)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={GLYPHS[k].path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
