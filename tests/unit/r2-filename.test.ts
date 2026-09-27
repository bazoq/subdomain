import { describe, expect, it } from "vitest";
import { safeFilename } from "@/server/storage/r2";

/**
 * `safeFilename` builds the `Content-Disposition` filename for signed downloads. Visitor-supplied
 * names (CVs, prescriptions) must not be able to inject headers or escape the parameter.
 */
describe("safeFilename", () => {
  it("keeps ordinary names and returns matching ascii / RFC 5987 forms", () => {
    expect(safeFilename("resume.pdf", "file")).toEqual({ ascii: "resume.pdf", utf8: "resume.pdf" });
    expect(safeFilename("My CV (final).docx", "file")).toEqual({ ascii: "My CV (final).docx", utf8: "My%20CV%20%28final%29.docx" });
  });

  it("strips directory components from both slash styles", () => {
    expect(safeFilename("../../etc/passwd", "file").ascii).toBe("passwd");
    expect(safeFilename("C:\\Users\\ali\\cv.pdf", "file").ascii).toBe("cv.pdf");
    expect(safeFilename("/tmp//x/report.pdf", "file").ascii).toBe("report.pdf");
  });

  it("removes header-injection and parameter-breaking characters", () => {
    const { ascii, utf8 } = safeFilename('evil"; filename="x.exe\r\nX-Injected: 1', "file");
    expect(ascii).not.toMatch(/["\\;\r\n]/);
    expect(utf8).not.toMatch(/["\\;\r\n]/);
    expect(ascii).toBe("evil filename=x.exeX-Injected: 1");
    expect(safeFilename("a\u0000b\u001fc\u007fd.txt", "file").ascii).toBe("abcd.txt");
  });

  it("collapses whitespace, trims and drops leading dots (no hidden files)", () => {
    expect(safeFilename("   my    cv .pdf  ", "file").ascii).toBe("my cv .pdf");
    expect(safeFilename("...hidden", "file").ascii).toBe("hidden");
  });

  it("falls back when nothing usable remains", () => {
    expect(safeFilename("", "download.bin").ascii).toBe("download.bin");
    expect(safeFilename("///", "download.bin").ascii).toBe("download.bin");
    expect(safeFilename('"";;\\', "download.bin").ascii).toBe("download.bin");
    expect(safeFilename("...", "download.bin").ascii).toBe("download.bin");
  });

  it("caps the length at 100 while keeping a short extension", () => {
    const long = `${"a".repeat(150)}.pdf`;
    const { ascii } = safeFilename(long, "file");
    expect(ascii).toHaveLength(100);
    expect(ascii.endsWith(".pdf")).toBe(true);
    // Over-long "extension" is not treated as one.
    const weird = `${"b".repeat(120)}.${"c".repeat(20)}`;
    expect(safeFilename(weird, "file").ascii).toHaveLength(100);
  });

  it("gives an ASCII-only fallback and a percent-encoded UTF-8 form for Urdu names", () => {
    const { ascii, utf8 } = safeFilename("درخواست.pdf", "file");
    expect(ascii).toMatch(/^[\x20-\x7e]+$/);
    expect(ascii).toBe("_______.pdf");
    expect(utf8).toBe(encodeURIComponent("درخواست.pdf"));
    expect(decodeURIComponent(utf8)).toBe("درخواست.pdf");
  });

  it("percent-encodes the characters encodeURIComponent leaves alone but RFC 5987 reserves", () => {
    expect(safeFilename("a'b(c)d*e.txt", "file").utf8).toBe("a%27b%28c%29d%2Ae.txt");
  });
});
