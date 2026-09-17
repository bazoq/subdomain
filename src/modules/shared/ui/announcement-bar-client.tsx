"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnnouncementBarClient({
  storageKey,
  text,
  link,
  className,
  variant = "primary",
}: {
  storageKey: string;
  text: string;
  link?: string;
  className?: string;
  variant?: "primary" | "accent" | "dark";
}) {
  const [hidden, setHidden] = React.useState(true);
  React.useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setHidden(false);
    }
  }, [storageKey]);
  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };
  const skin = variant === "accent" ? "bg-t-accent text-t-accent-fg" : variant === "dark" ? "bg-t-dark text-t-dark-fg" : "bg-t-primary text-t-primary-fg";
  const external = !!link && /^https?:/.test(link);
  const inner = (
    <span className="inline-flex items-center gap-2">
      <Megaphone className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn(link && "underline-offset-2 hover:underline")}>{text}</span>
    </span>
  );
  return (
    <div role="region" aria-label="Announcement" className={cn("relative z-40 px-10 py-2 text-center text-sm font-medium", skin, className)}>
      {link ? (
        external ? (
          <a href={link} target="_blank" rel="noreferrer">
            {inner}
          </a>
        ) : (
          <Link href={link}>{inner}</Link>
        )
      ) : (
        inner
      )}
      <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-80 hover:bg-black/10 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}
