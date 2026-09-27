import "server-only";
import { env } from "@/config/env";

/**
 * Keyed hashing with SESSION_SECRET for every server-side token that must be unforgeable
 * (session tokens, upload-confirm tokens). `purpose` gives domain separation so a value
 * produced for one use can never be replayed for another.
 */

let hmacKey: Promise<CryptoKey> | null = null;
function key() {
  hmacKey ??= crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hmacKey;
}

export async function hmacHex(purpose: string, input: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(`${purpose}\u0000${input}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison of two hex strings (length leak is acceptable: lengths are public). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
