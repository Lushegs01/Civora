"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function DemoTag() {
  const { locale } = useLocale();
  return (
    <div className="rounded-2xl border border-line bg-muted px-3.5 py-3 text-[12px] leading-relaxed text-ink-soft">
      <span className="chip mb-1.5 bg-warning-soft text-warning">{t("demo.data", locale) || "Demo data"}</span>
      <p>
        {t("demo.desc.part1", locale) || "All cases, organizations and people in this build are "}
        <strong className="font-semibold text-ink">{t("demo.desc.part2", locale) || "fictional"}</strong>
        {t("demo.desc.part3", locale) || ", created for evaluation."}
      </p>
    </div>
  );
}
