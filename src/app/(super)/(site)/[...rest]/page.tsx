import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched URLs on the platform host. The app has several root layouts, so Next has no
 * single global 404 to fall back on; without this file an unknown path renders the framework's bare
 * "404" outside any layout. Calling notFound() here shows the branded (site)/not-found.tsx instead.
 */
export default function CatchAll() {
  notFound();
}
