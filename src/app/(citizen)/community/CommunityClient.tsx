"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { TopBar } from "@/components/shell/TopBar";
import { CommunityExplorer } from "@/components/community/CommunityExplorer";
import type { CaseCardRow } from "@/components/case/CaseCard";

export function CommunityClient({ rows, hasMore }: { rows: CaseCardRow[]; hasMore?: boolean }) {
  const { locale } = useLocale();
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          {t("community.title", locale) || "Community cases"}
        </h1>
        <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
          {t("community.description", locale) || "Follow documented civic issues and see how they progress. Reporter identities are never shown; unverified information is always labelled as such."}
        </p>
        <div className="mt-6">
          <CommunityExplorer rows={rows} />
          {hasMore && (
            <p className="mt-5 text-center text-[13px] text-ink-soft">
              {t("community.more", locale) ||
                "Showing the most recently updated cases. Use search and filters to narrow the list."}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
