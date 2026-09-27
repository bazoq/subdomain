/**
 * Open-redirect guard for `?next=` / `?back=` style parameters. Pure (no Next imports) so it can
 * be unit-tested and used from route handlers, server actions and pages alike.
 *
 * Accepts only a same-origin, path-absolute target:
 *   - exactly one leading "/" (rejects "//evil", "/\evil" and "/%5Cevil" which browsers parse as
 *     scheme-relative), no scheme, no backslash, no control characters or whitespace
 *   - resolved against a dummy origin, the URL must stay on that origin
 *   - optionally constrained to a path prefix (e.g. "/admin")
 * Returns the sanitised path + query (fragment dropped) or `fallback`.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback: string, opts: { prefix?: string; maxLength?: number } = {}): string {
  if (typeof raw !== "string") return fallback;
  const next = raw.trim();
  if (!next || next.length > (opts.maxLength ?? 512)) return fallback;
  if (next[0] !== "/" || next[1] === "/" || next[1] === "\\") return fallback;
  if (/[\\\s]/.test(next)) return fallback;
  for (let i = 0; i < next.length; i++) {
    const c = next.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return fallback;
  }
  let url: URL;
  try {
    url = new URL(next, "https://redirect.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "https://redirect.invalid" || url.username || url.password) return fallback;
  // Percent-encoded slashes/backslashes in the first segment could still be re-interpreted downstream.
  if (/^\/(%2f|%5c)/i.test(url.pathname)) return fallback;
  if (opts.prefix && url.pathname !== opts.prefix && !url.pathname.startsWith(opts.prefix.endsWith("/") ? opts.prefix : `${opts.prefix}/`)) {
    return fallback;
  }
  return `${url.pathname}${url.search}`;
}
