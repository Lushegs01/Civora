"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function TrustExplainer({ className }: { className?: string }) {
  const { locale } = useLocale();
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="bg-brand-soft/30 px-5 py-4 border-b border-line">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-brand-deep">
          <Icon name="shield-check" className="h-4 w-4" />
          {t("case.trust.title", locale)}
        </h3>
        <p className="mt-1 text-[13px] text-ink-soft">
          {t("case.trust.subtitle", locale)}
        </p>
      </div>
      <div className="px-5 py-5 space-y-4">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
            <span className="text-[11px] font-bold">1</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">{t("case.trust.step1.title", locale)}</p>
            <p className="text-[13px] text-ink-soft">
              {t("case.trust.step1.desc", locale)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <span className="text-[11px] font-bold">2</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">{t("case.trust.step2.title", locale)}</p>
            <p className="text-[13px] text-ink-soft">
              {t("case.trust.step2.desc", locale)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <span className="text-[11px] font-bold">3</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">{t("case.trust.step3.title", locale)}</p>
            <p className="text-[13px] text-ink-soft">
              {t("case.trust.step3.desc", locale)}
            </p>
          </div>
        </div>
        
        <div className="mt-2 pt-4 border-t border-line text-[12.5px] text-ink-soft">
          <strong>{t("case.trust.note", locale)}</strong> {t("case.trust.noteDesc", locale)}
        </div>
      </div>
    </div>
  );
}
