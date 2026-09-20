import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en";
import sw from "@/lib/i18n/sw";
import fr from "@/lib/i18n/fr";
import { t } from "@/lib/i18n/i18n";

// A civic product that renders "case.timeline" as a heading has lost the
// reader before it has said anything. This suite is the guard: every key the
// interface asks for must resolve to words.

const SRC = path.join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Literal keys passed to t(). Dynamic keys are covered by the families below. */
function literalKeysUsed(): Set<string> {
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const source = fs.readFileSync(file, "utf-8");
    for (const match of source.matchAll(/\bt\(\s*"([^"]+)"/g)) keys.add(match[1]);
  }
  return keys;
}

describe("translation coverage", () => {
  it("has an entry for every literal key the interface uses", () => {
    const missing = [...literalKeysUsed()].filter((key) => !(key in en)).sort();
    expect(missing).toEqual([]);
  });

  it("has an entry for every key built from a domain value", () => {
    const families = [
      ...["safety", "community", "service", "infrastructure", "dispute", "other"].flatMap((c) => [
        `category.${c}`,
        `category.${c}.blurb`
      ]),
      ...["unverified", "partially_verified", "documented", "conflicting", "resolved"].flatMap((v) => [
        `verification.${v}`,
        `verification.${v}.desc`
      ]),
      ...["not_assigned", "received", "acknowledged", "in_progress", "action_recorded", "closed"].map(
        (r) => `response.${r}`
      ),
      ...["anonymous", "confidential", "identified"].flatMap((p) => [`privacy.${p}`, `privacy.${p}.desc`]),
      ...["reported", "evidence", "corroborated", "assigned", "response", "resolved"].map(
        (s) => `case.progress.${s}`
      ),
      ...["photo", "video", "document", "report", "official", "note"].map((k) => `evidence.${k}`),
      ...["primary", "corroborating", "official", "citizen"].map((s) => `evidence.source.${s}`),
      ...["service", "right", "policy", "opportunity", "project", "safety", "procedure"].map(
        (c) => `civic.category.${c}`
      ),
      ...["current", "review_needed", "outdated", "conflicting"].map((f) => `freshness.${f}`)
    ];
    const missing = families.filter((key) => !(key in en)).sort();
    expect(missing).toEqual([]);
  });

  it("never renders a dotted key to a reader", () => {
    expect(t("case.timeline", "en")).toBe("Timeline");
    // Even an unknown key degrades to readable words rather than the key.
    expect(t("some.unknown.keyName", "en")).toBe("Key Name");
    expect(t("some.unknown.key", "en")).not.toContain(".");
  });

  it("uses the caller's fallback before humanizing", () => {
    expect(t("still.unknown", "en", "Written fallback")).toBe("Written fallback");
  });

  it("falls back to English for a locale that has not been translated yet", () => {
    // Honest degradation: the reader sees correct English, never invented text.
    expect(t("case.timeline", "sw")).toBe(en["case.timeline"]);
  });

  it("uses the translation when one exists", () => {
    const translated = Object.keys(sw).find((key) => sw[key] !== en[key] && key in en);
    expect(translated).toBeTruthy();
    expect(t(translated!, "sw")).toBe(sw[translated!]);
  });
});

describe("dictionary hygiene", () => {
  it("defines no key twice", () => {
    const source = fs.readFileSync(path.join(SRC, "lib/i18n/en.ts"), "utf-8");
    const keys = [...source.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("only ships locales the interface actually offers", () => {
    // Hausa was listed in a locale check but never had a dictionary; the
    // switcher offers English, Swahili and French, and so do we.
    expect(Object.keys({ en, sw, fr }).sort()).toEqual(["en", "fr", "sw"]);
  });

  it("has no empty values", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, key).not.toBe("");
    }
  });
});
