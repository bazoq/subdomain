import { describe, expect, it } from "vitest";
import { safeExternalUrl, safeImageSrc, safeLinkHref } from "@/lib/utils";

/**
 * Tenant-supplied URL validation (src/lib/utils.ts). These helpers stand between the database and
 * `href` / `src` attributes, so every dangerous scheme and every parser trick must come back null.
 */

const DANGEROUS = [
  "javascript:alert(1)",
  "JAVASCRIPT:alert(1)",
  "java\u0000script:alert(1)",
  "javascript :alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "intent://scan#Intent;end",
  "//evil.example/x",
  "https://exa mple.com",
  "https://example.com/\u0001",
  "https://example.com/\ttab",
];

describe("safeExternalUrl", () => {
  it("accepts http(s) and returns the normalised absolute form", () => {
    expect(safeExternalUrl("https://example.com")).toBe("https://example.com/");
    expect(safeExternalUrl("  HTTP://Example.COM/Path?q=1#frag ")).toBe("http://example.com/Path?q=1#frag");
    expect(safeExternalUrl("https://sub.example.pk:8443/a/b")).toBe("https://sub.example.pk:8443/a/b");
  });

  it("rejects empty input", () => {
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
  });

  it("rejects every non-http(s) scheme, protocol-relative URLs and control characters", () => {
    for (const v of DANGEROUS) expect(safeExternalUrl(v), v).toBeNull();
    expect(safeExternalUrl("mailto:a@b.pk")).toBeNull();
    expect(safeExternalUrl("tel:+923001234567")).toBeNull();
    expect(safeExternalUrl("ftp://files.example.com/x")).toBeNull();
  });

  it("rejects relative paths and bare domains (callers add https:// deliberately)", () => {
    expect(safeExternalUrl("/shop")).toBeNull();
    expect(safeExternalUrl("example.com")).toBeNull();
    expect(safeExternalUrl("https://")).toBeNull();
  });
});

describe("safeLinkHref", () => {
  it("keeps same-origin paths, fragments and query-only links (not external)", () => {
    expect(safeLinkHref("/shop")).toEqual({ href: "/shop", external: false });
    expect(safeLinkHref("/shop?cat=deals#top")).toEqual({ href: "/shop?cat=deals#top", external: false });
    expect(safeLinkHref("#contact")).toEqual({ href: "#contact", external: false });
    expect(safeLinkHref("?page=2")).toEqual({ href: "?page=2", external: false });
  });

  it("normalises http(s) links and marks them external", () => {
    expect(safeLinkHref("https://facebook.com/karachipizza")).toEqual({ href: "https://facebook.com/karachipizza", external: true });
    expect(safeLinkHref("HTTP://Example.COM")).toEqual({ href: "http://example.com/", external: true });
  });

  it("allows contact schemes verbatim", () => {
    for (const v of ["mailto:hello@example.pk", "tel:+923001234567", "sms:+923001234567", "whatsapp://send?phone=923001234567", "TEL:0300"]) {
      expect(safeLinkHref(v), v).toEqual({ href: v, external: true });
    }
  });

  it("turns bare domains into https links", () => {
    expect(safeLinkHref("example.com")).toEqual({ href: "https://example.com/", external: true });
    expect(safeLinkHref("www.example.pk/menu?x=1")).toEqual({ href: "https://www.example.pk/menu?x=1", external: true });
    expect(safeLinkHref("Shop.Example.PK")).toEqual({ href: "https://shop.example.pk/", external: true });
  });

  it("turns bare words into same-origin paths", () => {
    expect(safeLinkHref("about")).toEqual({ href: "/about", external: false });
    expect(safeLinkHref("./about")).toEqual({ href: "/about", external: false });
    expect(safeLinkHref("shop/lawn-3pc")).toEqual({ href: "/shop/lawn-3pc", external: false });
  });

  it("rejects dangerous schemes, protocol-relative URLs, control characters and empty values", () => {
    for (const v of DANGEROUS) expect(safeLinkHref(v), v).toBeNull();
    expect(safeLinkHref("data:image/png;base64,AAAA")).toBeNull();
    expect(safeLinkHref("ftp://files.example.com")).toBeNull();
    expect(safeLinkHref("")).toBeNull();
    expect(safeLinkHref(null)).toBeNull();
    expect(safeLinkHref(undefined)).toBeNull();
  });

  it("never returns an href outside the allow-listed shapes", () => {
    const outputs = ["about", "/x", "#y", "example.com", "https://a.b", "mailto:x@y.z", "tel:1", "sms:1", "whatsapp:1"].map((v) => safeLinkHref(v)?.href ?? "").filter(Boolean);
    expect(outputs).toHaveLength(9);
    for (const href of outputs) expect(href).toMatch(/^(?:\/|#|\?|https?:|mailto:|tel:|sms:|whatsapp:)/);
  });
});

describe("safeImageSrc", () => {
  it("accepts same-origin paths, http(s), blob: previews and base64 data:image/*", () => {
    expect(safeImageSrc("/media/t1/logo.png")).toBe("/media/t1/logo.png");
    expect(safeImageSrc("  https://media.example.pk/a.webp ")).toBe("https://media.example.pk/a.webp");
    expect(safeImageSrc("blob:https://shop.example.pk/3f2a-uuid")).toBe("blob:https://shop.example.pk/3f2a-uuid");
    for (const mime of ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg+xml"]) {
      const v = `data:image/${mime};base64,AAAA`;
      expect(safeImageSrc(v), v).toBe(v);
    }
    expect(safeImageSrc("DATA:IMAGE/PNG;BASE64,AAAA")).toBe("DATA:IMAGE/PNG;BASE64,AAAA");
  });

  it("rejects non-image data URIs and un-encoded SVG", () => {
    expect(safeImageSrc("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(safeImageSrc("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
    expect(safeImageSrc("data:image/svg+xml;utf8,<svg/>")).toBeNull();
    expect(safeImageSrc("data:application/octet-stream;base64,AAAA")).toBeNull();
  });

  it("rejects dangerous schemes, protocol-relative URLs, control characters, bare domains and empty values", () => {
    for (const v of DANGEROUS) expect(safeImageSrc(v), v).toBeNull();
    expect(safeImageSrc("cdn.example.com/a.png")).toBeNull();
    expect(safeImageSrc("a.png")).toBeNull();
    expect(safeImageSrc("")).toBeNull();
    expect(safeImageSrc(null)).toBeNull();
    expect(safeImageSrc(undefined)).toBeNull();
  });
});
