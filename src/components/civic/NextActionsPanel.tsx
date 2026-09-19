import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import type { NextAction } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n";

export function NextActionsPanel({ actions, locale = "en" }: { actions: NextAction[]; locale?: Locale }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {actions.map((action, idx) => {
        let label = action.label;
        if (action.labelKey) {
          label = t(action.labelKey as any, locale);
        }

        const variant = action.type === "report" || action.type === "apply" ? "primary" : "secondary";


        let iconName = action.icon || "arrow-right";
        if (action.type === "link") iconName = "external-link";
        if (action.type === "report") iconName = "alert-circle";
        if (action.type === "apply") iconName = "clipboard-signature";
        if (action.type === "contact") iconName = "phone";
        if (action.type === "share") iconName = "share-2";
        if (action.type === "save") iconName = "bookmark";

        if (action.href) {
          return (
            <Button 
              key={idx} 
              href={action.href} 
              external={action.href.startsWith("http")} 
              icon={iconName}
              variant={variant}
            >
              {label}
            </Button>
          );
        }

        return (
          <Button key={idx} icon={iconName} variant={variant}>
            {label}
          </Button>
        );
      })}
    </div>
  );
}
