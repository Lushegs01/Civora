import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { Jurisdiction } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n";

export function JurisdictionBadge({ 
  jurisdiction, 
  locale = "en",
  className 
}: { 
  jurisdiction: Jurisdiction; 
  locale?: Locale;
  className?: string;
}) {
  const appliesTo = t("jurisdiction.applies_to", locale);
  
  const parts = [];
  parts.push(jurisdiction.country);
  if (jurisdiction.region) parts.unshift(jurisdiction.region);
  if (jurisdiction.locality) parts.unshift(jurisdiction.locality);

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 rounded-md px-2 py-1", className)}>
      <Icon name="map-pin" className="h-4 w-4 text-slate-500" />
      <span className="font-medium text-slate-700">{appliesTo}:</span>
      <span>{parts.join(" > ")}</span>
    </div>
  );
}
