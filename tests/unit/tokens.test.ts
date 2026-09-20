import { describe, expect, it } from "vitest";
import {
  hashRecoveryCode,
  hashToken,
  normalizeRecoveryCode,
  randomRecoveryCode,
  randomToken,
  tokenMatchesHash
} from "@/lib/auth/tokens";
import { hashPassword, secretEquals, verifyPassword } from "@/lib/auth/password";

describe("tracking tokens", () => {
  it("generates tokens with at least 192 bits of entropy", () => {
    const token = randomToken(32);
    // base64url of 32 bytes ≈ 43 characters.
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("never repeats a token", () => {
    const tokens = new Set(Array.from({ length: 500 }, () => randomToken()));
    expect(tokens.size).toBe(500);
  });

  it("stores only a hash, and the hash does not reveal the token", () => {
    const token = randomToken();
    const hash = hashToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
  });

  it("matches a token against its stored hash", () => {
    const token = randomToken();
    expect(tokenMatchesHash(token, hashToken(token))).toBe(true);
  });

  it("rejects a different token, a missing token and a missing hash", () => {
    const hash = hashToken(randomToken());
    expect(tokenMatchesHash(randomToken(), hash)).toBe(false);
    expect(tokenMatchesHash(null, hash)).toBe(false);
    expect(tokenMatchesHash(randomToken(), null)).toBe(false);
    expect(tokenMatchesHash("", "")).toBe(false);
  });

  it("does not throw on a malformed stored hash", () => {
    expect(tokenMatchesHash(randomToken(), "not-a-hash")).toBe(false);
    expect(tokenMatchesHash(randomToken(), "abc")).toBe(false);
  });
});

describe("recovery codes", () => {
  it("produces a transcribable code with no look-alike characters", () => {
    const code = randomRecoveryCode();
    expect(code).toMatch(/^[23456789A-HJKMNP-TV-Z]{4}-[23456789A-HJKMNP-TV-Z]{4}-[23456789A-HJKMNP-TV-Z]{4}$/);
    // No characters that get confused on paper.
    expect(code).not.toMatch(/[01ILOU]/);
  });

  it("uses the whole alphabet, so the keyspace is what it looks like", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i += 1) {
      for (const ch of randomRecoveryCode().replace(/-/g, "")) seen.add(ch);
    }
    expect(seen.size).toBe(30);
  });

  it("normalizes user formatting differences", () => {
    const code = randomRecoveryCode();
    const messy = ` ${code.toLowerCase().replace(/-/g, " ")} `;
    expect(hashRecoveryCode(messy)).toBe(hashRecoveryCode(code));
    expect(normalizeRecoveryCode(messy)).toHaveLength(12);
  });
});

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("a-reasonable-passphrase");
    expect(await verifyPassword("a-reasonable-passphrase", hash)).toBe(true);
  });

  it("rejects a wrong password and a missing hash", async () => {
    const hash = await hashPassword("a-reasonable-passphrase");
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });

  it("salts, so the same password hashes differently each time", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("compares shared secrets without leaking length", () => {
    expect(secretEquals("civora-demo", "civora-demo")).toBe(true);
    expect(secretEquals("civora-demo", "civora-demo-x")).toBe(false);
  });
});
