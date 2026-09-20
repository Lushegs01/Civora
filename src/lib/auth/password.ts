import crypto from "node:crypto";

// scrypt password hashing on node:crypto — no native build step, no extra
// dependency, and memory-hard enough to make offline cracking expensive.

const KEY_LENGTH = 64;
const SCRYPT_PARAMS: crypto.ScryptOptions = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt);
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Still spend the time, so "no such account" and "wrong password" take
    // roughly as long as each other.
    await scrypt(password, crypto.randomBytes(16));
    return false;
  }
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = await scrypt(password, salt, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * 1024 * 1024
  });
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

function scrypt(password: string, salt: Buffer, params: crypto.ScryptOptions = SCRYPT_PARAMS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, params, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
}

/** Constant-time comparison for short shared secrets (e.g. the demo code). */
export function secretEquals(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
