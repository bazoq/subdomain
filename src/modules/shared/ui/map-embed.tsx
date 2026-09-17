import { cn } from "@/lib/utils";

/** Only Google Maps embed URLs are allowed inside the iframe. */
export function safeMapUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return null;
    const okHost = u.hostname === "www.google.com" || u.hostname === "maps.google.com" || u.hostname === "google.com";
    if (!okHost) return null;
    if (u.hostname !== "maps.google.com" && !u.pathname.startsWith("/maps")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function MapEmbed({ url, className, title = "Map", aspect = "aspect-[4/3]" }: { url?: string | null; className?: string; title?: string; aspect?: string }) {
  const src = safeMapUrl(url);
  if (!src) return null;
  return (
    <div className={cn("overflow-hidden rounded-[var(--t-radius)] border border-t-border bg-t-muted", aspect, className)}>
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
