"use client";

import { FreshnessBadge } from "./FreshnessBadge";
import { JurisdictionBadge } from "./JurisdictionBadge";
import { NextActionsPanel } from "./NextActionsPanel";
import { AiTranslateCard } from "./AiTranslateCard";
import { AiExplainCard } from "./AiExplainCard";
import { Icon } from "@/components/ui/Icon";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { CivicInfoItem } from "@/lib/civic-types";
import { CIVIC_CATEGORY_META } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import { useLocale } from "@/components/system/LocaleProvider";
import { cn } from "@/lib/utils";

export function TrustCard({ 
  item 
}: { 
  item: CivicInfoItem; 
}) {
  const { locale } = useLocale();
  const categoryMeta = CIVIC_CATEGORY_META[item.category];
  
  // Try to use language version if available
  const hasTranslation = !!item.languageVersions[locale];
  const localizedContent = item.languageVersions[locale] || {
    title: item.title,
    explanation: item.explanation,
    eligibility: item.eligibility,
    requirements: item.requirements
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header section */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium uppercase tracking-wider">
            <Icon name={categoryMeta.icon as any} className="h-4 w-4" />
            {t(categoryMeta.labelKey as any, locale)}
          </div>
          <FreshnessBadge state={item.freshnessState} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">{localizedContent.title}</h1>
        
        <JurisdictionBadge jurisdiction={item.jurisdiction} className="mb-4" />

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Icon name="building" className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-800">{item.officialSource}</span>
            <span className="text-slate-400">({item.sourceAuthority})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="calendar" className="h-4 w-4 text-slate-400" />
            <span>{t("trustcard.published", locale)} <RelativeTime iso={item.publishedAt} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="check-circle" className="h-4 w-4 text-slate-400" />
            <span>{t("trustcard.last_verified", locale)} <RelativeTime iso={item.lastVerifiedAt} /></span>
          </div>
        </div>
      </div>

      {/* Body section */}
      <div className="p-6">
        <div className="prose prose-slate max-w-none">
          {!hasTranslation && locale !== "en" && (
            <AiTranslateCard text={`${item.title}\n\n${item.explanation}`} />
          )}

          <p className="text-lg text-slate-700 leading-relaxed">
            {localizedContent.explanation}
          </p>
          
          <AiExplainCard text={localizedContent.explanation} />

          {localizedContent.eligibility && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Icon name="users" className="h-4 w-4" />
                {t("trustcard.eligibility", locale)}
              </h3>
              <p className="mt-2 text-slate-700">{localizedContent.eligibility}</p>
            </div>
          )}

          {localizedContent.requirements && localizedContent.requirements.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Icon name="list-checks" className="h-4 w-4" />
                {t("trustcard.requirements", locale)}
              </h3>
              <ul className="mt-2 text-slate-700 list-disc pl-5">
                {localizedContent.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {item.whatRemainsUncertain && item.whatRemainsUncertain.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-800 flex items-center gap-2">
                <Icon name="help-circle" className="h-4 w-4" />
                {t("trustcard.what_uncertain", locale)}
              </h3>
              <ul className="mt-2 text-orange-900 list-disc pl-5">
                {item.whatRemainsUncertain.map((unc, i) => (
                  <li key={i}>{unc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions section */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">{t("trustcard.what_you_can_do", locale)}</h4>
          <NextActionsPanel actions={item.nextActions} />
        </div>
        {item.sourceUrl && (
          <a 
            href={item.sourceUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-4 sm:mt-0 whitespace-nowrap"
          >
            {t("trustcard.original_source", locale)}
            <Icon name="external-link" className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {item.fictional && (
        <div className="bg-purple-100 text-purple-800 text-xs text-center py-1 font-medium tracking-wide">
          {t("system.demo_data", locale)}
        </div>
      )}
    </div>
  );
}
