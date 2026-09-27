import { notFound } from "next/navigation";

/**
 * Catch-all for URLs on a tenant host that match no public route. Without it Next would serve its
 * unstyled default 404; with it the branded `(site)/not-found.tsx` renders inside the template layout.
 * Static and dynamic sibling segments (`/shop/[slug]`, `/sitemap.xml`, `/admin/**`) always win over this.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
