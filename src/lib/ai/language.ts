import { z } from "zod";
import type { Locale } from "../validation/schemas";
import { chat, providerName, type ProviderName } from "./provider";

// Translation and plain-language explanation.
//
// The previous build simulated translation by reversing letters and appending
// vowels, and labelled the result "Translate to Swahili". Nothing here ever
// presents generated or untranslated text as a translation: when no model is
// configured the endpoint says so, in the reader's own language, and returns
// the original text unchanged and clearly marked.

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  ar: "Arabic"
};

export type LanguageResultStatus = "translated" | "unavailable" | "source_language";

export interface LanguageResult {
  status: LanguageResultStatus;
  /** Present only when status === "translated". */
  text?: string;
  /** The untouched input, so the UI can always show something readable. */
  sourceText: string;
  targetLanguage: string;
  provider: ProviderName;
  /** Reader-facing explanation, already in the requested language. */
  notice: string;
}

const UNAVAILABLE_NOTICE: Record<Locale, string> = {
  en: "Machine translation is not enabled on this deployment, so the original text is shown unchanged.",
  sw: "Tafsiri ya mashine haijawashwa kwenye mfumo huu, kwa hivyo maandishi ya awali yanaonyeshwa bila mabadiliko.",
  fr: "La traduction automatique n'est pas activée sur ce déploiement ; le texte original est affiché tel quel.",
  ar: "الترجمة الآلية غير مُفعَّلة في هذه النسخة، لذا يُعرض النص الأصلي كما هو."
};

const FAILED_NOTICE: Record<Locale, string> = {
  en: "The translation service could not be reached. The original text is shown unchanged.",
  sw: "Huduma ya tafsiri haikupatikana. Maandishi ya awali yanaonyeshwa bila mabadiliko.",
  fr: "Le service de traduction est injoignable. Le texte original est affiché tel quel.",
  ar: "تعذّر الوصول إلى خدمة الترجمة. يُعرض النص الأصلي كما هو."
};

const TRANSLATED_NOTICE: Record<Locale, string> = {
  en: "Machine translation. Wording may differ from the official source.",
  sw: "Tafsiri ya mashine. Maneno yanaweza kutofautiana na chanzo rasmi.",
  fr: "Traduction automatique. La formulation peut différer de la source officielle.",
  ar: "ترجمة آلية. قد تختلف الصياغة عن المصدر الرسمي."
};

const SOURCE_NOTICE: Record<Locale, string> = {
  en: "This text is already in English.",
  sw: "Maandishi haya tayari yako kwa Kiingereza.",
  fr: "Ce texte est déjà en anglais.",
  ar: "هذا النص بالعربية أصلًا."
};

export async function translateText(text: string, locale: Locale): Promise<LanguageResult> {
  const base = {
    sourceText: text,
    targetLanguage: LANGUAGE_NAMES[locale],
    provider: providerName()
  };

  // Civora's source content is authored in English.
  if (locale === "en") {
    return { ...base, status: "source_language", notice: SOURCE_NOTICE.en };
  }

  const result = await chat({
    system:
      `Translate the user's text into ${LANGUAGE_NAMES[locale]}. ` +
      "Preserve meaning exactly, keep civic and legal terms accurate, and add no commentary. " +
      "Return only the translated text.",
    user: text,
    temperature: 0.1,
    maxOutputTokens: 900
  });

  if (!result.ok) {
    return {
      ...base,
      status: "unavailable",
      notice: result.reason === "not_configured" ? UNAVAILABLE_NOTICE[locale] : FAILED_NOTICE[locale]
    };
  }

  // A provider that echoes the input has not translated anything; say so
  // rather than presenting identical text as a translation.
  if (normalize(result.content) === normalize(text)) {
    return { ...base, status: "unavailable", notice: FAILED_NOTICE[locale] };
  }

  return { ...base, status: "translated", text: result.content, notice: TRANSLATED_NOTICE[locale] };
}

export interface ExplainResult {
  status: "explained" | "unavailable";
  text?: string;
  sourceText: string;
  provider: ProviderName;
  notice: string;
}

const EXPLAIN_UNAVAILABLE: Record<Locale, string> = {
  en: "Plain-language rewriting is not enabled on this deployment. The original explanation is shown below.",
  sw: "Uandishi kwa lugha rahisi haujawashwa kwenye mfumo huu. Maelezo ya awali yameonyeshwa hapa chini.",
  fr: "La reformulation en langage simple n'est pas activée ici. L'explication d'origine est affichée ci-dessous.",
  ar: "إعادة الصياغة بلغة مبسّطة غير مُفعَّلة في هذه النسخة. ويُعرض الشرح الأصلي أدناه."
};

const EXPLAIN_NOTICE: Record<Locale, string> = {
  en: "AI-assisted plain-language summary. The official source above remains authoritative.",
  sw: "Muhtasari wa lugha rahisi uliosaidiwa na AI. Chanzo rasmi hapo juu ndicho chenye mamlaka.",
  fr: "Résumé en langage simple assisté par IA. La source officielle ci-dessus fait foi.",
  ar: "ملخّص بلغة مبسّطة بمساعدة الذكاء الاصطناعي. ويبقى المصدر الرسمي أعلاه هو المرجع."
};

export const explainSchema = z.string().trim().min(10).max(1200);

export async function explainText(text: string, locale: Locale): Promise<ExplainResult> {
  const base = { sourceText: text, provider: providerName() };
  const result = await chat({
    system:
      "Rewrite the user's civic text in plain language a reader with basic literacy can follow. " +
      `Write in ${LANGUAGE_NAMES[locale]}. Keep it under four short sentences. ` +
      "Add nothing that is not in the source. Do not give legal advice.",
    user: text,
    temperature: 0.2,
    maxOutputTokens: 400
  });

  if (!result.ok) {
    return { ...base, status: "unavailable", notice: EXPLAIN_UNAVAILABLE[locale] };
  }
  const parsed = explainSchema.safeParse(result.content);
  if (!parsed.success) {
    return { ...base, status: "unavailable", notice: EXPLAIN_UNAVAILABLE[locale] };
  }
  return { ...base, status: "explained", text: parsed.data, notice: EXPLAIN_NOTICE[locale] };
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
