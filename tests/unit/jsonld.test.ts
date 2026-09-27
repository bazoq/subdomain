import { describe, expect, it, vi } from "vitest";
import { CATEGORY_MAP, type CategoryKey } from "@/lib/categories";
import { parseSettings } from "@/lib/tenant-settings";
import type { TenantContext } from "@/server/tenant";
import type { Job, Property } from "@/generated/prisma/client";

/**
 * schema.org builders for module detail pages (src/modules/shared/jsonld.ts). They are pure, but the module
 * imports `@/server/site-seo` for `tenantUrl` / `businessId`, which in turn imports Prisma — so the db is stubbed.
 * The contract under test: only validated values reach the JSON-LD (no empties, no relative / data: images, mapped
 * enum values), and empty inputs produce `null` rather than an empty graph.
 */

vi.mock("@/server/db", () => ({ db: {} }));

const jsonld = await import("@/modules/shared/jsonld");

function ctx(category: CategoryKey = "recruiting"): TenantContext {
  const cat = CATEGORY_MAP[category];
  return {
    tenant: { id: "t_1", slug: "acme", name: "Acme Pvt Ltd", category: cat.key, templateId: `${cat.key}-01`, status: "ACTIVE", isDemo: false } as unknown as TenantContext["tenant"],
    settings: parseSettings({}),
    category: cat,
    host: "acme.pk",
  };
}

const NOW = new Date("2026-09-01T10:00:00.000Z");

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "job_1",
    tenantId: "t_1",
    slug: "site-engineer",
    title: { en: "Site Engineer", ur: "سائٹ انجینئر" },
    description: { en: "  Supervise   works\n on site. " },
    company: null,
    location: "Lahore",
    country: "",
    type: "Full-time",
    department: null,
    experience: null,
    salaryMin: null,
    salaryMax: null,
    vacancies: 0,
    deadline: null,
    createdAt: NOW,
    ...overrides,
  } as unknown as Job;
}

function property(overrides: Partial<Property> = {}): Property {
  return {
    id: "p_1",
    tenantId: "t_1",
    slug: "dha-5-marla",
    title: { en: "5 Marla house in DHA" },
    description: { en: "Brand new." },
    location: "DHA Phase 6",
    city: "Lahore",
    type: "HOUSE",
    purpose: "SALE",
    price: 45_000_000,
    priceUnit: "TOTAL",
    bedrooms: 3,
    bathrooms: null,
    areaValue: 5,
    areaUnit: "MARLA",
    features: ["Parking", "Lawn"],
    images: ["https://cdn.example.com/a.jpg", "/uploads/b.jpg", "data:image/png;base64,AAAA", null],
    ...overrides,
  } as unknown as Property;
}

describe("compactJsonLd", () => {
  it("drops undefined, null, empty strings and empty arrays but keeps 0 / false / non-empty values", () => {
    expect(jsonld.compactJsonLd({ a: undefined, b: null, c: "", d: [], e: 0, f: false, g: "x", h: [1], i: {} })).toEqual({ e: 0, f: false, g: "x", h: [1], i: {} });
  });
});

describe("plainText", () => {
  it("collapses whitespace, resolves the language and truncates with an ellipsis", () => {
    expect(jsonld.plainText({ en: " Hello \n  world ", ur: "سلام" }, "en")).toBe("Hello world");
    expect(jsonld.plainText({ en: "Hello", ur: "سلام" }, "ur")).toBe("سلام");
    expect(jsonld.plainText("abcdef", "en", 4)).toBe("abc…");
    expect(jsonld.plainText("   ", "en")).toBeUndefined();
    expect(jsonld.plainText(null, "en")).toBeUndefined();
  });
});

describe("absoluteImages", () => {
  it("keeps only absolute http(s) URLs (relative, data:, javascript:, null are dropped)", () => {
    expect(
      jsonld.absoluteImages(["https://cdn.example.com/a.jpg", "HTTP://cdn.example.com/b.png", "/uploads/c.jpg", "data:image/png;base64,AAAA", "javascript:alert(1)", "cdn.example.com/d.jpg", null, undefined, ""]),
    ).toEqual(["https://cdn.example.com/a.jpg", "HTTP://cdn.example.com/b.png"]);
  });
});

describe("jobPostingJsonLd", () => {
  it("maps the job type to schema.org employmentType and marks remote jobs TELECOMMUTE", () => {
    const tc = ctx();
    expect(jsonld.jobPostingJsonLd(tc, job({ type: "Full-time" }), "en").employmentType).toBe("FULL_TIME");
    expect(jsonld.jobPostingJsonLd(tc, job({ type: "Part-time" }), "en").employmentType).toBe("PART_TIME");
    expect(jsonld.jobPostingJsonLd(tc, job({ type: "Contract" }), "en").employmentType).toBe("CONTRACTOR");
    expect(jsonld.jobPostingJsonLd(tc, job({ type: "Overseas" }), "en").employmentType).toBe("FULL_TIME");
    expect(jsonld.jobPostingJsonLd(tc, job({ type: "Something else" }), "en").employmentType).toBe("FULL_TIME");
    const remote = jsonld.jobPostingJsonLd(tc, job({ type: "Remote" }), "en");
    expect(remote.employmentType).toBe("FULL_TIME");
    expect(remote.jobLocationType).toBe("TELECOMMUTE");
    expect(jsonld.jobPostingJsonLd(tc, job(), "en")).not.toHaveProperty("jobLocationType");
  });

  it("emits validated core fields and omits empties (no salary, no deadline, zero vacancies)", () => {
    const d = jsonld.jobPostingJsonLd(ctx(), job(), "en");
    expect(d["@context"]).toBe("https://schema.org");
    expect(d["@type"]).toBe("JobPosting");
    expect(d.title).toBe("Site Engineer");
    expect(d.description).toBe("Supervise works on site.");
    expect(d.url).toBe("https://acme.pk/jobs/site-engineer");
    expect(d.datePosted).toBe("2026-09-01T10:00:00.000Z");
    expect(d.hiringOrganization).toEqual({ "@type": "Organization", "@id": "https://acme.pk/#business", name: "Acme Pvt Ltd" });
    expect(d.jobLocation).toEqual({ "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "Pakistan" } });
    expect(d.directApply).toBe(true);
    for (const k of ["baseSalary", "validThrough", "totalJobOpenings", "experienceRequirements", "industry"]) expect(d, k).not.toHaveProperty(k);
  });

  it("uses the Urdu title when available and builds a PKR monthly salary range", () => {
    const d = jsonld.jobPostingJsonLd(ctx(), job({ company: "Client Co", salaryMin: 80_000, salaryMax: null, vacancies: 3, deadline: new Date("2026-12-31T00:00:00.000Z") }), "ur");
    expect(d.title).toBe("سائٹ انجینئر");
    expect(d.hiringOrganization).toEqual({ "@type": "Organization", name: "Client Co" });
    expect(d.baseSalary).toEqual({ "@type": "MonetaryAmount", currency: "PKR", value: { "@type": "QuantitativeValue", minValue: 80_000, unitText: "MONTH" } });
    expect(d.totalJobOpenings).toBe(3);
    expect(d.validThrough).toBe("2026-12-31T00:00:00.000Z");
  });

  it("ignores an invalid deadline date", () => {
    expect(jsonld.jobPostingJsonLd(ctx(), job({ deadline: new Date("not a date") }), "en")).not.toHaveProperty("validThrough");
  });
});

describe("propertyJsonLd", () => {
  it("emits a sale Offer with an itemOffered Place and only absolute images", () => {
    const d = jsonld.propertyJsonLd(ctx("realestate"), property(), "en");
    expect(d["@type"]).toBe("Offer");
    expect(d.price).toBe(45_000_000);
    expect(d.priceCurrency).toBe("PKR");
    expect(d.businessFunction).toBe("http://purl.org/goodrelations/v1#Sell");
    expect(d.image).toEqual(["https://cdn.example.com/a.jpg"]);
    expect(d).not.toHaveProperty("priceSpecification");
    const place = d.itemOffered as Record<string, unknown>;
    expect(place["@type"]).toBe("House");
    expect(place.numberOfRooms).toBe(3);
    expect(place).not.toHaveProperty("numberOfBathroomsTotal");
    expect(place.floorSize).toEqual({ "@type": "QuantitativeValue", value: 5, unitText: "Marla" });
    expect(place.address).toEqual({ "@type": "PostalAddress", streetAddress: "DHA Phase 6", addressLocality: "Lahore", addressCountry: "PK" });
    expect(place.amenityFeature).toEqual([
      { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Lawn", value: true },
    ]);
  });

  it("rent → monthly UnitPriceSpecification (unitCode MON) and LeaseOut business function", () => {
    const d = jsonld.propertyJsonLd(ctx("realestate"), property({ purpose: "RENT", priceUnit: "MONTHLY", price: 120_000 }), "en");
    expect(d.priceSpecification).toEqual({ "@type": "UnitPriceSpecification", price: 120_000, priceCurrency: "PKR", unitCode: "MON" });
    expect(d.businessFunction).toBe("http://purl.org/goodrelations/v1#LeaseOut");
    // a MONTHLY price unit alone is also a monthly specification
    expect(jsonld.propertyJsonLd(ctx("realestate"), property({ purpose: "SALE", priceUnit: "MONTHLY" }), "en").priceSpecification).toMatchObject({ unitCode: "MON" });
  });

  it("maps property types to schema.org places and falls back to Place / raw area unit", () => {
    expect((jsonld.propertyJsonLd(ctx("realestate"), property({ type: "FLAT" }), "en").itemOffered as Record<string, unknown>)["@type"]).toBe("Apartment");
    expect((jsonld.propertyJsonLd(ctx("realestate"), property({ type: "PLOT" }), "en").itemOffered as Record<string, unknown>)["@type"]).toBe("Place");
    const odd = jsonld.propertyJsonLd(ctx("realestate"), property({ type: "SOMETHING", areaUnit: "ACRE", areaValue: 0, images: [] }), "en");
    const place = odd.itemOffered as Record<string, unknown>;
    expect(place["@type"]).toBe("Place");
    expect(place).not.toHaveProperty("floorSize");
    expect(odd).not.toHaveProperty("image");
  });
});

describe("faqPageJsonLd", () => {
  it("returns null when there are no usable rows", () => {
    expect(jsonld.faqPageJsonLd([], "en")).toBeNull();
    expect(jsonld.faqPageJsonLd([{ question: { en: "" }, answer: { en: "x" } }, { question: "Q", answer: "   " }, { question: null, answer: undefined }], "en")).toBeNull();
  });

  it("builds a FAQPage with one Question per complete row, in the requested language", () => {
    const d = jsonld.faqPageJsonLd(
      [
        { question: { en: "Do you deliver?", ur: "کیا آپ ڈیلیوری کرتے ہیں؟" }, answer: { en: "Yes, city-wide.", ur: "جی ہاں۔" } },
        { question: { en: "Skipped" }, answer: "" },
        { question: "Plain string question", answer: "Plain answer" },
      ],
      "ur",
    );
    expect(d).not.toBeNull();
    expect(d?.["@type"]).toBe("FAQPage");
    expect(d?.mainEntity).toEqual([
      { "@type": "Question", name: "کیا آپ ڈیلیوری کرتے ہیں؟", acceptedAnswer: { "@type": "Answer", text: "جی ہاں۔" } },
      { "@type": "Question", name: "Plain string question", acceptedAnswer: { "@type": "Answer", text: "Plain answer" } },
    ]);
  });
});
