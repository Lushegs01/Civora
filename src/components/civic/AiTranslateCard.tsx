"use client";

import { useState } from "react";
import { useLocale } from "@/components/system/LocaleProvider";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";

interface TranslateResponse {
  status: "translated" | "unavailable" | "source_language";
  text?: string;
  sourceText: string;
  targetLanguage: string;
  notice: string;
}

/**
 * Machine translation of a civic item.
 *
 * When no translation provider is configured the panel says so in the reader's
 * own language and shows the original text unchanged. It never presents
 * altered or untranslated text as a translation.
 */
export function AiTranslateCard({ text }: { text: string }) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (!next || result || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || t("ai.translate.error", locale) || "Translation is unavailable right now.");
        return;
      }
      setResult(data as TranslateResponse);
    } catch {
      setError(t("ai.translate.error", locale) || "Translation is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  // Civora's source content is authored in English.
  if (locale === "en") return null;

  const translated = result?.status === "translated";

  return (
    <div className="mt-4 mb-6 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50">
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between p-4 text-start transition-colors hover:bg-indigo-100"
      >
        <span className="flex items-center gap-2 font-medium text-indigo-900">
          <Icon name="languages" className="h-5 w-5 text-indigo-600" />
          {t("action.translate", locale) || "Translate this page"}
        </span>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="h-5 w-5 text-indigo-400" />
      </button>

      {isOpen && (
        <div className="border-t border-indigo-100 p-4" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
              {t("system.loading", locale)}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-indigo-950">
              {error}
            </p>
          )}

          {result && (
            <div className="text-sm leading-relaxed text-indigo-950">
              <p className="mb-2 flex items-start gap-1.5 text-xs font-medium text-indigo-700">
                <Icon
                  name={translated ? "languages" : "info"}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                />
                <span>{result.notice}</span>
              </p>
              <p className="whitespace-pre-wrap">{translated ? result.text : result.sourceText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
