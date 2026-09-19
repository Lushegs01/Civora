"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { CasePageBody } from "@/components/case/CasePageBody";
import { CaseView } from "@/lib/case-view";

export function PublicCaseClient({ view }: { view: CaseView }) {
  const { locale } = useLocale();
  return <CasePageBody view={view} backHref="/community" backLabel={t("community.title", locale) || "Community cases"} />;
}
