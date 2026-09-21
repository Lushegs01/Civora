"use client";

import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";
import { useLocale } from "@/components/system/LocaleProvider";

// Written out rather than built from a template: literal keys are the ones the
// coverage test can see, and this panel is the page's claim about why anything
// on it can be trusted — the worst place for it to fall back to a humanized key.
const WHY_POINTS = [
  ["trustcard.why.source", "trustcard.why.source.desc"],
  ["trustcard.why.freshness", "trustcard.why.freshness.desc"],
  ["trustcard.why.uncertainty", "trustcard.why.uncertainty.desc"]
] as const;

export function VerificationExplainer() {
  const { locale } = useLocale();
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-8">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
        <Icon name="shield-check" className="h-4 w-4 text-emerald-600" />
        {t("trustcard.why_trusted", locale)}
      </h3>
      <div className="space-y-3 text-sm text-slate-600">
        {WHY_POINTS.map(([label, description]) => (
          <p key={label}>
            <strong>{t(label, locale)}</strong> {t(description, locale)}
          </p>
        ))}
      </div>
    </div>
  );
}
