"use client";

import { cn } from "@/lib/utils";
import type { PublicCaseView } from "@/lib/dto/case";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function TrustPanel({ view, className }: { view: PublicCaseView; className?: string }) {
  const { locale } = useLocale();
  const { known, uncertain } = view;
  return (
    <section aria-label={t("case.trustPanel.ariaLabel", locale)} className={cn("space-y-3", className)}>
      <div className="card overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1 shrink-0 bg-success" aria-hidden="true" />
          <div className="flex-1 px-4 py-4">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Icon name="check" className="h-3 w-3" strokeWidth={2.8} />
              </span>
              {t("case.trustPanel.known", locale)}
            </h2>
            {known.length === 0 ? (
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                {t("case.trustPanel.nothingEstablished", locale)}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {known.map((k, i) => (
                  <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1 shrink-0 bg-warning" aria-hidden="true" />
          <div className="flex-1 px-4 py-4">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                <Icon name="triangle-alert" className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {t("case.trustPanel.uncertain", locale)}
            </h2>
            {uncertain.length === 0 ? (
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                {t("case.trustPanel.noUncertainties", locale)}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {uncertain.map((u, i) => (
                  <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                    <Icon name="triangle-alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={2.2} />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
