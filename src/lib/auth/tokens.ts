import crypto from "node:crypto";

// Every secret Civora hands a user — tracking tokens, session tokens, recovery
// codes — is random, stored only as a SHA-256 hash and compared in constant
// time. A database dump therefore cannot be replayed against the service.

/** 192 bits of entropy, URL-safe. */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Human-transcribable recovery code, e.g. "K4D9-2MTX-7PRQ".
 *
 * Crockford-style alphabet: 0/O, 1/I/L and U are all omitted, because this is
 * a code someone writes on paper and types back weeks later. Characters are
 * drawn by rejection sampling rather than a modulo, so every character is
 * equally likely — a biased alphabet would quietly shrink the keyspace.
 */
const RECOVERY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function randomRecoveryCode(): string {
  const chars: string[] = [];
  const limit = Math.floor(256 / RECOVERY_ALPHABET.length) * RECOVERY_ALPHABET.length;
  while (chars.length < 12) {
    for (const byte of crypto.randomBytes(24)) {
      if (byte >= limit) continue;
      chars.push(RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]);
      if (chars.length === 12) break;
    }
  }
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

/** Constant-time comparison of a presented token against a stored hash. */
export function tokenMatchesHash(token: string | null | undefined, storedHash: string | null | undefined): boolean {
  if (!token || !storedHash) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Salted, truncated hash of a client identifier — for abuse analysis only. */
export function pseudonymize(value: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(value).digest("hex").slice(0, 32);
}

export function sha256(input: string | Uint8Array): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
