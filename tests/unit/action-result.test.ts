import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail, formToObject, fromZod, idle, success } from "@/lib/action-result";

describe("action-result helpers", () => {
  it("idle is a non-ok result with an empty message", () => {
    expect(idle).toEqual({ ok: false, message: "" });
  });

  it("fail carries message and optional field errors", () => {
    expect(fail("Nope")).toEqual({ ok: false, message: "Nope", fieldErrors: undefined });
    expect(fail("Nope", { name: "Required" })).toEqual({ ok: false, message: "Nope", fieldErrors: { name: "Required" } });
  });

  it("success carries optional message and data", () => {
    expect(success()).toEqual({ ok: true, message: undefined, data: undefined });
    expect(success("Saved.", { id: "x" })).toEqual({ ok: true, message: "Saved.", data: { id: "x" } });
  });

  it("fromZod maps issues to dotted paths and keeps the first message per field", () => {
    const schema = z.object({
      name: z.string().min(2, "Too short").regex(/^[a-z]+$/, "Lowercase only"),
      contact: z.object({ phone: z.string().min(5, "Phone required") }),
    });
    const r = schema.safeParse({ name: "A1", contact: { phone: "" } });
    expect(r.success).toBe(false);
    if (r.success) return;
    const res = fromZod(r.error);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.message).toBe("Please fix the highlighted fields.");
    expect(res.fieldErrors).toEqual({ name: "Lowercase only", "contact.phone": "Phone required" });
  });
});

describe("formToObject", () => {
  it("skips Next internal $ keys and groups repeated keys into arrays", () => {
    const fd = new FormData();
    fd.append("$ACTION_ID", "abc");
    fd.append("name", "Ali");
    fd.append("tags", "a");
    fd.append("tags", "b");
    fd.append("tags", "c");
    expect(formToObject(fd)).toEqual({ name: "Ali", tags: ["a", "b", "c"] });
  });
});
