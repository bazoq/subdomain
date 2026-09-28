import { describe, expect, it } from "vitest";
import { buildKey, isPublicKey, publicUrlFor } from "@/server/storage/r2";

/**
 * `/media/<key>` serves objects straight from the private bucket, so `isPublicKey` is the only thing
 * keeping private uploads (CVs, prescriptions, print files) and arbitrary keys off that route.
 */
describe("isPublicKey", () => {
  it("accepts keys built for public tenant and platform files", () => {
    expect(isPublicKey(buildKey({ tenantId: "cmabc123xyz" }, "public", "jpg"))).toBe(true);
    expect(isPublicKey(buildKey({ platform: true }, "public", "svg"))).toBe(true);
  });

  it("rejects private keys", () => {
    expect(isPublicKey(buildKey({ tenantId: "cmabc123xyz" }, "private", "pdf"))).toBe(false);
    expect(isPublicKey(buildKey({ platform: true }, "private", "png"))).toBe(false);
  });

  it("rejects traversal, foreign prefixes and malformed names", () => {
    const ok = buildKey({ tenantId: "t1" }, "public", "png");
    expect(isPublicKey(`../${ok}`)).toBe(false);
    expect(isPublicKey(ok.replace("/public/", "/public/../private/"))).toBe(false);
    expect(isPublicKey(`x/${ok}`)).toBe(false);
    expect(isPublicKey("t/t1/public/2026/09/short.png")).toBe(false);
    expect(isPublicKey("t/t1/public/2026/09/aaaaaaaaaaaaaaaaaaaaa.PNG")).toBe(false);
    expect(isPublicKey("")).toBe(false);
  });
});

describe("publicUrlFor", () => {
  it("points at the app's /media route on the platform root", () => {
    expect(publicUrlFor("s/public/2026/09/aaaaaaaaaaaaaaaaaaaaa.png")).toMatch(/^https?:\/\/[^/]+\/media\/s\/public\/2026\/09\/aaaaaaaaaaaaaaaaaaaaa\.png$/);
  });
});
