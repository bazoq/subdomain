import type { ZodError } from "zod";

/** Standard shape returned by every server action used with useActionState. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export const idle: ActionResult<never> = { ok: false, message: "" };

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

export function success<T>(message?: string, data?: T): ActionResult<T> {
  return { ok: true, message, data };
}

export function fromZod(err: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
}

/** FormData → plain object (repeated keys become arrays; "on" checkboxes become booleans). */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$")) continue; // Next internal
    if (k in out) {
      const prev = out[k];
      out[k] = Array.isArray(prev) ? [...prev, v] : [prev, v];
    } else out[k] = v;
  }
  return out;
}
