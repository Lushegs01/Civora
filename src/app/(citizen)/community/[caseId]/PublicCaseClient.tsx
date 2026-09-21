"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { CitedByPanel, type CitingCivicItem } from "@/components/civic/CitedByPanel";
import { CasePageBody } from "@/components/case/CasePageBody";
import type { PublicCaseView } from "@/lib/dto/case";

export function PublicCaseClient({
  view,
  citedBy = []
}: {
  view: PublicCaseView;
  citedBy?: CitingCivicItem[];
}) {
  const { locale } = useLocale();
  return (
    <CasePageBody
      view={view}
      backHref="/community"
      backLabel={t("community.title", locale) || "Community cases"}
      after={<CitedByPanel items={citedBy} />}
    />
  );
}
