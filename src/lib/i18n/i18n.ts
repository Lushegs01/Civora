import en from "./en";
import ha from "./ha";
import fr from "./fr";

export type Locale = "en" | "ha" | "fr";
export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ha,
  fr
};

export function getDictionary(locale: Locale): Record<TranslationKey, string> {
  return dictionaries[locale] || dictionaries["en"];
}

// Global t() function for server components where context isn't passed down easily, 
// though React Context is preferred for client components.
export function t(key: TranslationKey, locale: Locale = "en"): string {
  const dict = dictionaries[locale] || dictionaries["en"];
  return dict[key] || en[key] || key;
}
