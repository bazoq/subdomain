import "server-only";
import bcrypt from "bcryptjs";

/**
 * Password hashing and policy.
 *  - bcrypt cost 12 (~250 ms on a Vercel function): slow enough for offline attacks, fast enough
 *    for login. Raise when hardware gets faster; existing hashes keep their own cost.
 *  - `DUMMY_HASH` is a real cost-12 hash of a random string. Login flows verify against it when
 *    the account does not exist so "unknown user" and "wrong password" take the same time.
 */

const ROUNDS = 12;

/** Valid bcrypt hash that matches no password; used to equalise timing for unknown accounts. */
export const DUMMY_HASH = "$2b$12$Jpt/O9KJUsksXnd4d5ou1.wsoKBGI/ospYqeOHh3rJXK4abvwv0bq";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

/** Very common passwords / keyboard walks that satisfy "letters + digits" but are guessed first. */
const DENYLIST = new Set([
  "password1",
  "password12",
  "password123",
  "password1234",
  "passw0rd",
  "passw0rd1",
  "qwerty123",
  "qwerty1234",
  "qwertyuiop1",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "abc123456",
  "abcd1234",
  "abcdef123",
  "admin123",
  "admin1234",
  "administrator1",
  "welcome1",
  "welcome123",
  "letmein123",
  "iloveyou1",
  "pakistan123",
  "karachi123",
  "lahore123",
  "siteforge1",
  "changeme1",
  "temp1234",
  "test1234",
  "user1234",
]);

/**
 * Strength policy: 10-200 chars, at least one letter and one digit, not a well-known password,
 * not a single repeated character. Returns an error message or null when acceptable.
 */
export function passwordPolicy(plain: string, context: { username?: string | null } = {}): string | null {
  if (typeof plain !== "string" || plain.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (plain.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  if (!/[a-zA-Z]/.test(plain) || !/\d/.test(plain)) return "Password must contain letters and numbers.";
  const lower = plain.toLowerCase();
  if (DENYLIST.has(lower)) return "That password is too common. Choose something less guessable.";
  if (/^(.)\1+$/.test(lower)) return "Password must not repeat a single character.";
  if (context.username && lower.includes(context.username.toLowerCase()) && context.username.length >= 4) {
    return "Password must not contain your username.";
  }
  return null;
}

/** Unambiguous alphabet (no 0/O, 1/l/I). 55 symbols. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/**
 * Cryptographically random password that satisfies `passwordPolicy`.
 * Rejection sampling removes modulo bias; the loop retries the rare draw with no digit/letter.
 */
export function generatePassword(length = 12): string {
  const len = Math.max(length, PASSWORD_MIN);
  const max = 256 - (256 % ALPHABET.length); // largest multiple of alphabet size below 256
  for (;;) {
    let out = "";
    while (out.length < len) {
      const bytes = crypto.getRandomValues(new Uint8Array(len * 2));
      for (const b of bytes) {
        if (b < max) out += ALPHABET[b % ALPHABET.length];
        if (out.length === len) break;
      }
    }
    if (passwordPolicy(out) === null) return out;
  }
}
