import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS, parseSettings, SETTINGS_MESSAGES, settingsFieldErrors, tenantSettingsSchema, tenantSettingsWriteSchema } from "@/lib/tenant-settings";

describe("tenant settings", () => {
  it("parses an empty blob into complete defaults", () => {
    const s = parseSettings(null);
    expect(s.languages).toEqual({ urduEnabled: false, defaultLang: "en" });
    expect(s.commerce.currency).toBe("PKR");
    expect(s.commerce.codEnabled).toBe(true);
    expect(s.commerce.defaultShippingFee).toBe(200);
    expect(s.restaurant.minDeliveryOrder).toBe(500);
    expect(s.hours).toEqual([]);
    expect(s.announcement).toEqual({ enabled: false, text: "" });
  });

  it("keeps valid overrides and fills the rest", () => {
    const s = parseSettings({ languages: { urduEnabled: true }, contact: { phone: "+923001234567" } });
    expect(s.languages.urduEnabled).toBe(true);
    expect(s.languages.defaultLang).toBe("en");
    expect(s.contact.phone).toBe("+923001234567");
    expect(s.contact.city).toBe("");
  });

  it("falls back to defaults when the stored blob is corrupt", () => {
    const s = parseSettings({ commerce: { currency: "USD", minOrder: -5 } });
    expect(s.commerce.currency).toBe("PKR");
    expect(s.commerce.minOrder).toBe(0);
  });

  it("rejects a foreign currency at the schema level", () => {
    expect(tenantSettingsSchema.safeParse({ commerce: { currency: "USD" } }).success).toBe(false);
  });

  it("DEFAULT_HOURS covers all seven days and is valid", () => {
    expect(DEFAULT_HOURS.map((h) => h.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(tenantSettingsSchema.safeParse({ hours: DEFAULT_HOURS }).success).toBe(true);
  });
});

describe("tenant settings - lenient read (per-field salvage)", () => {
  it("keeps the valid fields of a section whose other fields are corrupt", () => {
    const s = parseSettings({ commerce: { currency: "USD", minOrder: -5, orderPrefix: "ABC", codEnabled: false } });
    expect(s.commerce.currency).toBe("PKR");
    expect(s.commerce.minOrder).toBe(0);
    expect(s.commerce.orderPrefix).toBe("ABC");
    expect(s.commerce.codEnabled).toBe(false);
  });

  it("does not let one corrupt section wipe the others", () => {
    const s = parseSettings({ languages: { urduEnabled: true }, restaurant: "nope", hours: [{ day: 1 }, { day: 9 }, "x"] });
    expect(s.languages.urduEnabled).toBe(true);
    expect(s.restaurant.minDeliveryOrder).toBe(500);
    expect(s.hours).toEqual([{ day: 1, open: "09:00", close: "21:00", closed: false }]);
  });

  it("branding.hidePoweredBy: absent/invalid reads as not set (== show credit), explicit true is kept", () => {
    expect(parseSettings(null).branding.hidePoweredBy).toBeUndefined();
    expect(parseSettings({ branding: { hidePoweredBy: true } }).branding.hidePoweredBy).toBe(true);
    expect(parseSettings({ branding: { hidePoweredBy: "yes", primaryColor: "#123456" } }).branding).toEqual({ primaryColor: "#123456" });
  });
});

describe("tenant settings - strict write schema", () => {
  const w = tenantSettingsWriteSchema.shape;
  const contactBase = { phone: "03001234567", whatsapp: "", email: "", address: "", city: "" };

  it("normalises Pakistani phones and rejects invalid ones with a bilingual message", () => {
    const ok = w.contact.safeParse({ ...contactBase, phone: "0300 1234567", phone2: "021-34567890", whatsapp: "+92 300 1234567" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.phone).toBe("+923001234567");
      expect(ok.data.phone2).toBe("+922134567890");
      expect(ok.data.whatsapp).toBe("+923001234567");
    }
    const bad = w.contact.safeParse({ ...contactBase, phone: "12345", whatsapp: "abc" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const errs = settingsFieldErrors("contact", bad.error);
      expect(errs.phone).toBe(SETTINGS_MESSAGES.phone);
      expect(errs.whatsapp).toBe(SETTINGS_MESSAGES.phone);
      expect(errs.phone).toMatch(/[؀-ۿ]/);
    }
    const empty = w.contact.safeParse({ ...contactBase, phone: "" });
    expect(empty.success).toBe(false);
    if (!empty.success) expect(settingsFieldErrors("contact", empty.error).phone).toBe(SETTINGS_MESSAGES.phoneRequired);
  });

  it("validates e-mails; blank is allowed and stored per the read shape", () => {
    expect(w.contact.safeParse({ ...contactBase, email: "not-an-email" }).success).toBe(false);
    const c = w.contact.safeParse({ ...contactBase, email: "" });
    expect(c.success && c.data.email).toBe("");
    const n = w.notifications.safeParse({ emailTo: "  Owner@Shop.pk ", whatsappTo: "" });
    expect(n.success).toBe(true);
    if (n.success) expect(n.data).toEqual({ emailTo: "Owner@Shop.pk", whatsappTo: undefined });
    expect(w.notifications.safeParse({ whatsappTo: "0300" }).success).toBe(false);
  });

  it("accepts only safe http(s) social links and adds https:// to bare domains", () => {
    const ok = w.social.safeParse({ facebook: "facebook.com/myshop", instagram: "https://instagram.com/x", tiktok: "" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.facebook).toBe("https://facebook.com/myshop");
      expect(ok.data.tiktok).toBeUndefined();
    }
    for (const bad of ["javascript:alert(1)", "//evil.com", "mailto:a@b.pk", "shop"]) {
      const r = w.social.safeParse({ youtube: bad });
      expect(r.success, bad).toBe(false);
      if (!r.success) expect(settingsFieldErrors("social", r.error).youtube).toBe(SETTINGS_MESSAGES.url);
    }
  });

  it("announcement link may be a site path or an https link; text is required when enabled", () => {
    const ok = w.announcement.safeParse({ enabled: true, text: "Eid sale", link: "shop" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.link).toBe("/shop");
    expect(w.announcement.safeParse({ enabled: false, text: "", link: "https://example.com/sale" }).success).toBe(true);
    expect(w.announcement.safeParse({ enabled: false, text: "", link: "javascript:alert(1)" }).success).toBe(false);
    const noText = w.announcement.safeParse({ enabled: true, text: "   " });
    expect(noText.success).toBe(false);
    if (!noText.success) expect(settingsFieldErrors("announcement", noText.error).text).toBe(SETTINGS_MESSAGES.announcementText);
  });

  it("branding: hex colours only, image URLs must be https or a site path, hidePoweredBy defaults to false", () => {
    const ok = w.branding.safeParse({ primaryColor: "#1a2b3c", secondaryColor: "", logoUrl: "https://cdn.example.com/logo.png", faviconUrl: "/favicon.ico", hidePoweredBy: true });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.primaryColor).toBe("#1A2B3C");
      expect(ok.data.secondaryColor).toBeUndefined();
      expect(ok.data.hidePoweredBy).toBe(true);
    }
    const empty = w.branding.safeParse({});
    expect(empty.success && empty.data.hidePoweredBy).toBe(false);
    const bad = w.branding.safeParse({ primaryColor: "red", logoUrl: "data:image/png;base64,AAAA" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const errs = settingsFieldErrors("branding", bad.error);
      expect(errs.primaryColor).toBe(SETTINGS_MESSAGES.hex);
      expect(errs.logoUrl).toBe(SETTINGS_MESSAGES.image);
    }
  });

  it("seo: title <= 70, description <= 170, analytics ids shaped", () => {
    expect(w.seo.safeParse({ title: "x".repeat(70), description: "y".repeat(170), googleAnalyticsId: "g-abcd1234", facebookPixelId: "123456" }).success).toBe(true);
    const bad = w.seo.safeParse({ title: "x".repeat(71), description: "y".repeat(171), googleAnalyticsId: "abc", facebookPixelId: "12" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const errs = settingsFieldErrors("seo", bad.error);
      expect(errs.title).toBe(SETTINGS_MESSAGES.seoTitle);
      expect(errs.description).toBe(SETTINGS_MESSAGES.seoDescription);
      expect(errs.googleAnalyticsId).toBe(SETTINGS_MESSAGES.gaId);
      expect(errs.facebookPixelId).toBe(SETTINGS_MESSAGES.pixelId);
    }
  });

  it("contact.mapEmbedUrl accepts only a Google Maps embed link", () => {
    expect(w.contact.safeParse({ ...contactBase, mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18" }).success).toBe(true);
    expect(w.contact.safeParse({ ...contactBase, mapEmbedUrl: "https://maps.app.goo.gl/abc" }).success).toBe(false);
    expect(w.contact.safeParse({ ...contactBase, mapEmbedUrl: "http://www.google.com/maps/embed?pb=1" }).success).toBe(false);
  });

  it("commerce / restaurant numbers must be whole and non-negative; order prefix is 1-6 A-Z0-9", () => {
    const ok = w.commerce.safeParse({ minOrder: 0, defaultShippingFee: 200, orderPrefix: "ord", lowStockThreshold: 5 });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.orderPrefix).toBe("ORD");
    const bad = w.commerce.safeParse({ minOrder: -1, defaultShippingFee: 1.5, orderPrefix: "TOO-LONG" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const errs = settingsFieldErrors("commerce", bad.error);
      expect(errs.minOrder).toBe(SETTINGS_MESSAGES.wholeNumber);
      expect(errs.defaultShippingFee).toBe(SETTINGS_MESSAGES.wholeNumber);
      expect(errs.orderPrefix).toBe(SETTINGS_MESSAGES.orderPrefix);
    }
    expect(w.restaurant.safeParse({ prepTimeMins: -5 }).success).toBe(false);
  });

  it("hours: open/close required unless closed; errors are keyed by day for the form", () => {
    const rows = [
      { day: 1, open: "10:00", close: "22:00", closed: false },
      { day: 3, open: "", close: "22:00", closed: false },
      { day: 5, open: "", close: "", closed: true },
    ];
    const r = w.hours.safeParse(rows);
    expect(r.success).toBe(false);
    if (!r.success) expect(settingsFieldErrors("hours", r.error, rows)).toEqual({ "hours.3": SETTINGS_MESSAGES.hours });
    expect(w.hours.safeParse(DEFAULT_HOURS).success).toBe(true);
  });

  it("every write-schema output still satisfies the read schema", () => {
    const out = {
      branding: w.branding.parse({ primaryColor: "#123456" }),
      contact: w.contact.parse({ ...contactBase, email: "a@b.pk", city: "Lahore" }),
      social: w.social.parse({ facebook: "facebook.com/x" }),
      languages: w.languages.parse({ urduEnabled: true, defaultLang: "ur" }),
      commerce: w.commerce.parse({}),
      restaurant: w.restaurant.parse({}),
      hours: w.hours.parse(DEFAULT_HOURS),
      seo: w.seo.parse({ title: "Shop" }),
      notifications: w.notifications.parse({}),
      announcement: w.announcement.parse({ enabled: false, text: "" }),
    };
    expect(tenantSettingsSchema.safeParse(out).success).toBe(true);
  });
});
