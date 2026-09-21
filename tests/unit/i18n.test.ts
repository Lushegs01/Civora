import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en";
import sw from "@/lib/i18n/sw";
import fr from "@/lib/i18n/fr";
import ar from "@/lib/i18n/ar";
import { localeDirection, t } from "@/lib/i18n/i18n";
import { LOCALES } from "@/lib/validation/schemas";
import type { Locale } from "@/lib/i18n/i18n";

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

/**
 * Keys the interface reaches indirectly.
 *
 * Components collect keys in a const and pass the variable to t() —
 * `{ labelKey: "nav.landing.home" }`, `["cloud-off", "landing.conditions.1.title"]`.
 * literalKeysUsed() only sees a key written at the call site, so thirty of
 * these were missing from the dictionary while the suite stayed green, and
 * the landing page rendered humanize()'s output: seven cards headed "Label"
 * over the word "Detail", and a navigation that read English in every locale.
 *
 * So every key-shaped literal counts, whatever syntax carries it — but only
 * in files that call t() at all. Structured log event names share the dotted
 * shape ("ai.timeout", "case.view_failed") and reach log.error rather than
 * the dictionary; they live in API routes and lib internals, which render
 * nothing and so never call t().
 */
function indirectKeysUsed(): Set<string> {
  const namespaces = new Set(Object.keys(en).map((key) => key.split(".")[0]));
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const source = fs.readFileSync(file, "utf-8");
    if (!/\bt\(/.test(source)) continue;
    for (const match of source.matchAll(/"([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)"/g)) {
      const key = match[1];
      if (namespaces.has(key.split(".")[0])) keys.add(key);
    }
  }
  return keys;
}

/** Enum members, read from the authoritative schema rather than re-listed here. */
function schemaEnums(): Record<string, string[]> {
  const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf-8");
  const enums: Record<string, string[]> = {};
  for (const match of schema.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
    enums[match[1]] = match[2]
      .split("\n")
      .map((line) => line.replace(/\/\/.*$/, "").trim())
      .filter((line) => /^[a-z_][a-z0-9_]*$/i.test(line));
  }
  return enums;
}

/**
 * The domain each templated key family draws its members from.
 *
 * A family listed here is expanded and checked. A family that appears in the
 * source and is *not* listed here fails the test by name, so a new one cannot
 * be added without also being covered.
 */
const KEY_FAMILY_DOMAINS: Record<string, string> = {
  category: "CaseCategory",
  verification: "VerificationState",
  response: "ResponseState",
  privacy: "PrivacyMode",
  priority: "CasePriority",
  lang: "__locales"
};

/**
 * Keys built from a domain value at the call site — t(`response.${state}.desc`).
 *
 * The families used to be a hand-written list, and that is exactly how six
 * response descriptions and three priority labels went missing: the list held
 * `response.${r}` but not `response.${r}.desc`, and no priority family at all.
 * Nothing failed, because t() degrades an unknown key to its humanized last
 * segment — so every response badge's tooltip read "Desc", in all three
 * languages, and the suite stayed green.
 *
 * So the families are derived now. The shape comes from the source, the
 * members come from schema.prisma, and a new enum member or a new templated
 * call fails here until the dictionary has caught up.
 */
function templatedKeysUsed(): { keys: string[]; unregistered: string[] } {
  const enums = schemaEnums();
  const domains: Record<string, string[]> = { __locales: ["en", "sw", "fr"] };
  const keys = new Set<string>();
  const unregistered = new Set<string>();

  for (const file of sourceFiles(SRC)) {
    const source = fs.readFileSync(file, "utf-8");
    // `\bt(` alone also matches test( and expect(...).not(, so require that the
    // character before the call is not part of an identifier.
    for (const match of source.matchAll(/(^|[^\w.$])t\(\s*`([^`]+)`/gm)) {
      const template = match[2];
      const parts = template.split(/\$\{[^}]*\}/);
      if (parts.length !== 2) continue;
      const [prefix, suffix] = parts;
      const namespace = prefix.replace(/\.$/, "");
      if (!/^[a-z][a-zA-Z0-9_]*$/.test(namespace)) continue;
      const domain = KEY_FAMILY_DOMAINS[namespace];
      if (!domain) {
        unregistered.add(`${namespace} (from \`${template}\`)`);
        continue;
      }
      const members = domains[domain] ?? enums[domain];
      if (!members) {
        unregistered.add(`${namespace} -> ${domain} not found in schema.prisma`);
        continue;
      }
      for (const member of members) keys.add(`${prefix}${member}${suffix}`);
    }
  }
  return { keys: [...keys], unregistered: [...unregistered] };
}

describe("translation coverage", () => {
  it("has an entry for every literal key the interface uses", () => {
    const missing = [...literalKeysUsed()].filter((key) => !(key in en)).sort();
    expect(missing).toEqual([]);
  });

  it("has an entry for every key reached through a variable", () => {
    const missing = [...indirectKeysUsed()].filter((key) => !(key in en)).sort();
    expect(missing).toEqual([]);
  });

  it("registers every templated key family it finds in the source", () => {
    // A family the source builds but this test does not know how to expand is
    // an uncovered family, which is how the last gap survived. Name it here.
    expect(templatedKeysUsed().unregistered).toEqual([]);
  });

  it("has an entry for every key built from a domain value", () => {
    const missing = templatedKeysUsed()
      .keys.filter((key) => !(key in en))
      .sort();
    expect(missing).toEqual([]);
  });

  it("covers a domain value that is only ever reached through a template", () => {
    // priority.* is reached exclusively as t(`priority.${priority}`), so it is
    // invisible to both literal and indirect scanning. It was missing entirely.
    for (const member of schemaEnums().CasePriority) {
      expect(en[`priority.${member}` as keyof typeof en], `priority.${member}`).toBeTruthy();
    }
  });

  it("gives every response state a description, not just a label", () => {
    // The descriptions are the badge tooltips. Each one rendered as "Desc".
    for (const member of schemaEnums().ResponseState) {
      expect(en[`response.${member}.desc` as keyof typeof en], `response.${member}.desc`).toBeTruthy();
    }
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

  it("serves every English key in both translated locales", () => {
    // fr and sw sat at 41% for a while, so more than half the interface
    // silently rendered English to a reader who had chosen another language.
    // Parity is the guarantee now: a new English key cannot ship without its
    // translations, because this fails.
    // Derived from LOCALES, not listed by hand: a fourth language was added
    // and this assertion would have kept passing while none of it was checked.
    const dictionaries: Record<string, Record<string, string>> = { en, sw, fr, ar };
    const locales: Array<[string, Record<string, string>]> = LOCALES.filter((l) => l !== "en").map(
      (name) => [name, dictionaries[name]]
    );
    expect(locales.length).toBe(LOCALES.length - 1);
    for (const [name, dictionary] of locales) {
      const missing = Object.keys(en).filter((key) => !dictionary[key]);
      expect(missing, `${name} is missing translations`).toEqual([]);
    }
  });

  it("falls back to English for a locale with no dictionary of its own", () => {
    // Honest degradation: the reader sees correct English, never invented
    // text. Exercised through an unknown locale, since fr and sw are complete.
    expect(t("case.timeline", "xx" as Locale)).toBe(en["case.timeline"]);
  });

  it("uses the translation when one exists", () => {
    const swahili: Record<string, string> = sw;
    const english: Record<string, string> = en;
    const translated = Object.keys(swahili).find((key) => swahili[key] !== english[key]);
    expect(translated).toBeTruthy();
    expect(t(translated!, "sw")).toBe(swahili[translated!]);
  });
});

describe("writing direction", () => {
  it("marks Arabic right-to-left and everything else left-to-right", () => {
    expect(localeDirection("ar")).toBe("rtl");
    for (const locale of LOCALES.filter((l) => l !== "ar")) {
      expect(localeDirection(locale), locale).toBe("ltr");
    }
  });

  it("treats an unknown locale as left-to-right rather than throwing", () => {
    expect(localeDirection("xx")).toBe("ltr");
  });

  it("uses logical CSS properties, so `dir` actually flips the layout", () => {
    // ml-4 and text-left do not follow the document direction: with them the
    // text would run right-to-left inside a layout that stayed Western. The
    // components were converted to ms/me, ps/pe, start/end and text-start,
    // and this fails if a physical class creeps back in.
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const source = fs.readFileSync(file, "utf-8");
      for (const match of source.matchAll(/className=(?:\{)?["`'](.*?)["`']/gs)) {
        const physical = match[1].match(/\b(ml|mr|pl|pr)-[\d.]+|\btext-(left|right)\b|\bborder-(l|r)\b/g);
        if (physical) offenders.push(`${file.replace(SRC, "src")}: ${physical.join(", ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("dictionary hygiene", () => {
  it("defines no key twice", () => {
    const source = fs.readFileSync(path.join(SRC, "lib/i18n/en.ts"), "utf-8");
    const keys = [...source.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("ships a dictionary for every locale it offers, and no others", () => {
    // Hausa was once listed in a locale check but never had a dictionary.
    // Both directions are checked: a locale without a dictionary, and a
    // dictionary for a locale the switcher never offers.
    expect(Object.keys({ en, sw, fr, ar }).sort()).toEqual([...LOCALES].sort());
  });

  it("has no empty values", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, key).not.toBe("");
    }
  });
});
