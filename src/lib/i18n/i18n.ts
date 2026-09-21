import en from "./en";
import sw from "./sw";
import fr from "./fr";
import ar from "./ar";

export type { Locale } from "../validation/schemas";
import type { Locale } from "../validation/schemas";

export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<string, string>> = { en, sw, fr, ar };

/**
 * Writing direction for a locale.
 *
 * Kept here rather than in a component because layout, the `dir` attribute on
 * <html>, and anything that needs to know which side "start" is on all have to
 * agree. A locale absent from this map is left-to-right, which is the correct
 * default for every language the interface offers today except Arabic.
 */
const RTL_LOCALES = new Set<string>(["ar"]);

export function localeDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

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
  const value = dictionary[key] ?? dictionaries.en[key];
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
