"use client";

import { useState } from "react";
import { useLocale } from "@/components/system/LocaleProvider";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";

interface ExplainResponse {
  status: "explained" | "unavailable";
  text?: string;
  sourceText: string;
  notice: string;
}

/** Plain-language rewriting. Advisory: the official source stays authoritative. */
export function AiExplainCard({ text }: { text: string }) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (!next || result || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || t("ai.explain.error", locale) || "That explanation isn't available right now.");
        return;
      }
      setResult(data as ExplainResponse);
    } catch {
      setError(t("ai.explain.error", locale) || "That explanation isn't available right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 bg-blue-50">
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between p-4 text-start transition-colors hover:bg-blue-100"
      >
        <span className="flex items-center gap-2 font-medium text-blue-900">
          <Icon name="sparkles" className="h-5 w-5 text-blue-600" />
          {t("action.explain_simply", locale)}
        </span>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="h-5 w-5 text-blue-400" />
      </button>

      {isOpen && (
        <div className="border-t border-blue-100 p-4" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
              {t("system.loading", locale)}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-blue-950">
              {error}
            </p>
          )}

          {result && (
            <div className="text-sm leading-relaxed text-blue-950">
              <p className="mb-2 flex items-start gap-1.5 text-xs font-medium text-blue-700">
                <Icon
                  name={result.status === "explained" ? "cpu" : "info"}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                />
                <span>{result.notice}</span>
              </p>
              <p className="whitespace-pre-wrap">
                {result.status === "explained" ? result.text : result.sourceText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
