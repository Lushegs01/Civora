import Link from "next/link";
import { FreshnessBadge } from "./FreshnessBadge";
import { JurisdictionBadge } from "./JurisdictionBadge";
import { Icon } from "@/components/ui/Icon";
import type { CivicInfoItem } from "@/lib/civic-types";
import { CIVIC_CATEGORY_META } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n";

export function CivicInfoCard({ item, locale = "en" }: { item: CivicInfoItem; locale?: Locale }) {
  const categoryMeta = CIVIC_CATEGORY_META[item.category];
  const localizedTitle = item.languageVersions[locale]?.title || item.title;
  const localizedExplanation = item.languageVersions[locale]?.explanation || item.explanation;

  return (
    <Link 
      href={`/explore/${item.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <Icon name={categoryMeta.icon as any} className="h-3.5 w-3.5" />
          {t(categoryMeta.labelKey as any, locale)}
        </div>
        <FreshnessBadge state={item.freshnessState} locale={locale} />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">{localizedTitle}</h3>
      
      <p className="text-slate-600 text-sm line-clamp-2 mb-4">
        {localizedExplanation}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <JurisdictionBadge jurisdiction={item.jurisdiction} locale={locale} />
        <div className="flex items-center gap-1">
          <Icon name="building" className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">{item.officialSource}</span>
        </div>
      </div>
    </Link>
  );
}
