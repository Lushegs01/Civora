"use client";

import { Icon } from "@/components/ui/Icon";
import { t } from "@/lib/i18n/i18n";
import { useLocale } from "@/components/system/LocaleProvider";

export function VerificationExplainer() {
  const { locale } = useLocale();
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-8">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
        <Icon name="shield-check" className="h-4 w-4 text-emerald-600" />
        {t("trustcard.why_trusted", locale)}
      </h3>
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          <strong>Official Source:</strong> Information is directly sourced from authorized government or civic bodies.
        </p>
        <p>
          <strong>Freshness Checked:</strong> We track the last verified date to ensure requirements haven&rsquo;t changed.
        </p>
        <p>
          <strong>Transparent Uncertainty:</strong> If procedures are unclear or currently failing in practice, we document it clearly rather than hiding it.
        </p>
      </div>
    </div>
  );
}
