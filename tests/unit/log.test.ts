import { afterEach, describe, expect, it, vi } from "vitest";
import { errorFields, log, setLogSink, type LogLevel } from "@/lib/log";

function capture() {
  const lines: { level: LogLevel; record: Record<string, unknown> }[] = [];
  const prev = setLogSink((level, line) => lines.push({ level, record: JSON.parse(line) }));
  return { lines, restore: () => setLogSink(prev) };
}

describe("structured logger", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("emits one JSON record per call with time, level, msg and fields", () => {
    const c = capture();
    log.info("order.created", { tenantId: "t1", total: 1500 });
    c.restore();
    expect(c.lines).toHaveLength(1);
    expect(c.lines[0].level).toBe("info");
    expect(c.lines[0].record).toMatchObject({ level: "info", msg: "order.created", tenantId: "t1", total: 1500 });
    expect(typeof c.lines[0].record.time).toBe("string");
  });

  it("respects LOG_LEVEL threshold", () => {
    vi.stubEnv("LOG_LEVEL", "warn");
    const c = capture();
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    c.restore();
    expect(c.lines.map((l) => l.level)).toEqual(["warn", "error"]);
  });

  it("drops debug by default outside development", () => {
    const c = capture();
    log.debug("hidden");
    log.info("shown");
    c.restore();
    expect(c.lines.map((l) => l.record.msg)).toEqual(["shown"]);
  });

  it("never throws on unserialisable fields", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const c = capture();
    expect(() => log.error("boom", { circular })).not.toThrow();
    c.restore();
    expect(c.lines[0].record).toMatchObject({ msg: "boom", unserialisable: true });
  });

  it("errorFields normalises Errors, digests and non-Error values", () => {
    const err = Object.assign(new Error("bad"), { digest: "123" });
    expect(errorFields(err)).toMatchObject({ errorName: "Error", errorMessage: "bad", digest: "123" });
    expect(errorFields("plain")).toEqual({ errorMessage: "plain" });
  });
});
