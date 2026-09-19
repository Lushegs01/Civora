
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { type FreshnessState, FRESHNESS_META } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n";

export function FreshnessBadge({ state, locale = "en" }: { state: FreshnessState; locale?: Locale }) {
  const meta = FRESHNESS_META[state];
  const translatedLabel = t(meta.labelKey as any, locale);

  return (
    <span
      className={cn(
        "chip",
        meta.tone === "success" && "border border-green-200 bg-green-50 text-green-700",
        meta.tone === "warning" && "border border-amber-200 bg-amber-50 text-amber-700",
        meta.tone === "danger" && "border border-red-200 bg-red-50 text-red-700"
      )}
    >
      <Icon name={meta.icon as any} className="h-3.5 w-3.5" />
      {translatedLabel}
    </span>
  );
}
