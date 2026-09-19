"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/i18n";
import { t } from "@/lib/i18n/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const handleToggle = () => {
    const next: Record<Locale, Locale> = {
      en: "sw",
      sw: "fr",
      fr: "en"
    };
    setLocale(next[locale]);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      aria-label={t("lang.switch", locale)}
    >
      <Icon name="globe" className="h-5 w-5 opacity-70" />
      <span className="font-medium text-sm">
        {locale === "en" ? "English" : locale === "sw" ? "Swahili" : "Français"}
      </span>
    </button>
  );
}
