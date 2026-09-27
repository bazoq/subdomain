/**
 * Inline schema.org JSON-LD. Data blocks are not executed, so the enforced CSP does not apply; `<` is
 * escaped so a tenant-supplied string can never close the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) && data.length === 1 ? data[0] : data;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }} />;
}
