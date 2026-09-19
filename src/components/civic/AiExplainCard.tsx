"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";

export function AiExplainCard({ 
  text
}: { 
  text: string; 
}) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setIsOpen(!isOpen);
    if (!explanation && !isOpen) {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale })
        });
        const data = await res.json();
        setExplanation(data.data.explanation);
      } catch (e) {
        setExplanation(t("ai.explain.error", locale) || "Failed to generate explanation. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <button 
        onClick={handleExplain}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <Icon name="sparkles" className="h-5 w-5 text-blue-600" />
          {t("action.explain_simply", locale)}
        </div>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="h-5 w-5 text-blue-400" />
      </button>

      {isOpen && (
        <div className="p-4 pt-0 border-t border-blue-100 mt-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Icon name="loader-2" className="h-4 w-4 animate-spin" />
              {t("system.loading", locale)}
            </div>
          ) : (
            <div className="text-blue-950 text-sm leading-relaxed prose prose-blue">
              <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 uppercase tracking-wider font-semibold">
                <Icon name="cpu" className="h-3.5 w-3.5" />
                {t("system.ai_assisted", locale)}
              </div>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
