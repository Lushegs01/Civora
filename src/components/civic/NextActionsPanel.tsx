"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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

        // No destination. A button that looks live and does nothing is worse
        // on this panel than anywhere else in the product: the whole point of
        // it is telling the reader where to go next. So it says what it is —
        // an action the source names but whose address the corpus does not
        // carry — rather than swallowing the click.
        return (
          <span
            key={idx}
            title={t("civic.action.no_destination.desc", locale)}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-[14px] font-medium text-slate-500"
          >
            <Icon name={iconName} className="h-4 w-4" />
            {label}
            <span className="text-[12px] font-normal text-slate-400">
              {t("civic.action.no_destination", locale)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
