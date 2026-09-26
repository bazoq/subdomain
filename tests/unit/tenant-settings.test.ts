import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS, parseSettings, tenantSettingsSchema } from "@/lib/tenant-settings";

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
