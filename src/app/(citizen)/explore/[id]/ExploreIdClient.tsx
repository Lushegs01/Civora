"use client";

import Link from "next/link";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { TrustCard } from "@/components/civic/TrustCard";
import { VerificationExplainer } from "@/components/civic/VerificationExplainer";
import { TopBar } from "@/components/shell/TopBar";
import { Icon } from "@/components/ui/Icon";
import { CivicInfoItem } from "@/lib/civic-types";

export function ExploreIdClient({ item }: { item: CivicInfoItem }) {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      <TopBar />
      
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <Link 
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          {t("explore.back", locale) || "Back to Explorer"}
        </Link>
        <TrustCard item={item} />
        
        <VerificationExplainer />
      </div>
    </div>
  );
}
