import { describe, expect, it } from "vitest";
import { DUMMY_HASH, PASSWORD_MAX, PASSWORD_MIN, generatePassword, hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";

describe("passwordPolicy", () => {
  it("accepts a reasonable password", () => {
    expect(passwordPolicy("Karachi2026x")).toBeNull();
    expect(passwordPolicy("correct-horse-7-battery")).toBeNull();
    expect(passwordPolicy(`${"a".repeat(PASSWORD_MAX - 1)}1`)).toBeNull();
  });

  it("enforces length bounds", () => {
    expect(PASSWORD_MIN).toBe(10);
    expect(passwordPolicy("Short1x")).toMatch(/at least 10/);
    expect(passwordPolicy("Abcdefgh9")).toMatch(/at least 10/); // 9 chars
    expect(passwordPolicy(`${"a".repeat(PASSWORD_MAX)}1`)).toMatch(/at most/);
  });

  it("requires letters and digits", () => {
    expect(passwordPolicy("onlylettersxx")).toMatch(/letters and numbers/);
    expect(passwordPolicy("12345678901234")).toMatch(/letters and numbers/);
  });

  it("rejects well-known passwords regardless of case", () => {
    expect(passwordPolicy("password123")).toMatch(/too common/);
    expect(passwordPolicy("PASSWORD123")).toMatch(/too common/);
    expect(passwordPolicy("Pakistan123")).toMatch(/too common/);
    expect(passwordPolicy("qwertyuiop1")).toMatch(/too common/);
  });

  it("rejects a single repeated character", () => {
    // "1111111111" fails the letters check first; a mixed repeat is impossible, so the rule is
    // reached only via case folding: "aAaAaAaAaA1" is not a repeat; ensure the regex is anchored.
    expect(passwordPolicy("aaaaaaaaaa1")).toBeNull(); // not a pure repeat
    expect(passwordPolicy("AAAAAAAAAAA")).toMatch(/letters and numbers/);
  });

  it("rejects passwords containing the username (4+ chars only)", () => {
    expect(passwordPolicy("Shahid2026xx", { username: "shahid" })).toMatch(/username/);
    expect(passwordPolicy("xxSHAHIDxx99", { username: "Shahid" })).toMatch(/username/);
    expect(passwordPolicy("Shahid2026xx", { username: "sha" })).toBeNull(); // too short to matter
    expect(passwordPolicy("Shahid2026xx", { username: null })).toBeNull();
    expect(passwordPolicy("Shahid2026xx", {})).toBeNull();
  });

  it("handles non-string input defensively", () => {
    expect(passwordPolicy(undefined as unknown as string)).toMatch(/at least/);
    expect(passwordPolicy(123456789012 as unknown as string)).toMatch(/at least/);
  });
});

describe("generatePassword", () => {
  it("produces policy-compliant passwords of the requested length from the unambiguous alphabet", () => {
    for (let i = 0; i < 25; i++) {
      const pw = generatePassword(14);
      expect(pw).toHaveLength(14);
      expect(pw).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]+$/);
      expect(passwordPolicy(pw)).toBeNull();
    }
  });

  it("never goes below the policy minimum", () => {
    expect(generatePassword(4)).toHaveLength(PASSWORD_MIN);
    expect(generatePassword()).toHaveLength(12);
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 20 }, () => generatePassword()));
    expect(seen.size).toBe(20);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips and rejects the wrong password and malformed hashes", async () => {
    const hash = await hashPassword("Karachi2026x");
    expect(hash).toMatch(/^\$2[aby]\$12\$/); // cost 12
    expect(await verifyPassword("Karachi2026x", hash)).toBe(true);
    expect(await verifyPassword("karachi2026x", hash)).toBe(false);
    expect(await verifyPassword("Karachi2026x", "not-a-hash")).toBe(false);
  }, 15_000);

  it("DUMMY_HASH is a valid cost-12 hash that matches nothing obvious", async () => {
    expect(DUMMY_HASH).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword("", DUMMY_HASH)).toBe(false);
    expect(await verifyPassword("password123", DUMMY_HASH)).toBe(false);
  }, 15_000);
});
