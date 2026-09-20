import en from "./en";
import sw from "./sw";
import fr from "./fr";

export type { Locale } from "../validation/schemas";
import type { Locale } from "../validation/schemas";

export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<string, string>> = { en, sw, fr };

export function getDictionary(locale: Locale): Record<string, string> {
  return dictionaries[locale] ?? dictionaries.en;
}

const warned = new Set<string>();

/**
 * Looks up a translation.
 *
 * Resolution order: the requested locale, then English, then the caller's
 * fallback, then a humanized form of the key.
 *
 * That last step matters. The lookup used to return the raw key when nothing
 * matched, and because a raw key is a truthy string the widespread
 * `t(key, locale) || "English"` idiom never reached its fallback — public
 * pages rendered literal text like "case.timeline" as a heading. A reader
 * should never see the inside of the dictionary, so an unknown key degrades to
 * readable words and is reported once in development.
 */
export function t(key: string, locale: Locale = "en", fallback?: string): string {
  const dictionary = dictionaries[locale] ?? dictionaries.en;
  const value = dictionary[key] ?? en[key];
  if (value) return value;
  if (fallback) return fallback;

  if (process.env.NODE_ENV === "development" && !warned.has(key)) {
    warned.add(key);
    console.warn(`[i18n] missing translation for "${key}"`);
  }
  return humanize(key);
}

/** "case.trustPanel.known" → "Known". Last resort, never a dotted key. */
function humanize(key: string): string {
  const last = key.split(".").pop() ?? key;
  const words = last
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Keys present in the base dictionary — used by the i18n coverage test. */
export function knownKeys(): string[] {
  return Object.keys(en);
}
