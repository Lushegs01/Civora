"use client";

import { cn } from "@/lib/utils";
import type { PublicCaseView } from "@/lib/dto/case";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function CaseProgress({ view, className }: { view: PublicCaseView; className?: string }) {
  const { locale } = useLocale();
  return (
    <section aria-label={t("case.progress", locale)} className={cn("card px-5 py-5", className)}>
      <h2 className="meta-label mb-5">{t("case.progress", locale)}</h2>
      <ol className="flex items-start gap-1">
        {view.progress.map((step, i) => (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-1/2 top-[14px] -z-0 h-[2px] w-full",
                  step.done ? "bg-success" : "bg-line"
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2",
                step.done
                  ? "border-success bg-success text-white"
                  : step.current
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-canvas text-ink-soft/40"
              )}
            >
              {step.done ? (
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} />
              ) : step.current ? (
                <Icon name="loader-circle" className="h-3 w-3 animate-[spin_3s_linear_infinite]" strokeWidth={2.6} />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>
            <span
              className={cn(
                "text-[10.5px] font-medium leading-snug",
                step.done ? "text-ink" : step.current ? "font-semibold text-ink" : "text-ink-soft/50"
              )}
            >
              {t(step.labelKey, locale) || step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only">
        {view.progress.filter((s) => s.done).map((s) => t(s.labelKey, locale) || s.label).join(", ")} {t("case.completed", locale)}
        {view.progress.find((s) => !s.done) &&
          `${t("case.currentlyAt", locale)}${t(view.progress.find((s) => !s.done)!.labelKey, locale) || view.progress.find((s) => !s.done)!.label}.`}
      </p>
    </section>
  );
}
