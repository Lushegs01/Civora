"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";

export function AiTranslateCard({ 
  text
}: { 
  text: string; 
}) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setIsOpen(!isOpen);
    if (!translation && !isOpen) {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale })
        });
        const data = await res.json();
        setTranslation(data.data.translation);
      } catch (e) {
        setTranslation(t("ai.translate.error", locale) || "Failed to generate translation. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (locale === "en") return null;

  return (
    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden mb-6">
      <button 
        onClick={handleTranslate}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-indigo-900 font-medium">
          <Icon name="languages" className="h-5 w-5 text-indigo-600" />
          {t("action.translate", locale) || "Translate to " + (locale === "sw" ? "Swahili" : "French")}
        </div>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="h-5 w-5 text-indigo-400" />
      </button>

      {isOpen && (
        <div className="p-4 pt-0 border-t border-indigo-100 mt-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <Icon name="loader-2" className="h-4 w-4 animate-spin" />
              {t("system.loading", locale)}
            </div>
          ) : (
            <div className="text-indigo-950 text-sm leading-relaxed prose prose-indigo">
              <div className="flex items-center gap-1 text-xs text-indigo-600 mb-2 uppercase tracking-wider font-semibold">
                <Icon name="cpu" className="h-3.5 w-3.5" />
                {t("system.ai_assisted", locale)}
              </div>
              {translation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
