"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { Button } from "@/components/ui/Button";
import type { NextAction } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";

export function NextActionsPanel({ actions }: { actions: NextAction[] }) {
  const { locale } = useLocale();
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {actions.map((action, idx) => {
        let label = action.label;
        if (action.labelKey) {
          label = t(action.labelKey, locale);
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
