"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { listOutbox } from "@/lib/offline/db";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function OfflineBanner() {
  const { locale } = useLocale();
  const [offline, setOffline] = useState<boolean | null>(null);
  const [outboxCount, setOutboxCount] = useState(0);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (offline) {
      listOutbox().then(items => setOutboxCount(items.length)).catch(() => {});
    }
  }, [offline]);

  if (offline !== true) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-content px-4 pt-3 md:px-8"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Icon name="wifi-off" className="h-4 w-4" />
        </span>
        <div className="min-w-0 text-[13px] leading-snug">
          <p className="font-semibold text-ink">{t("offline.title", locale) || "No connection"}</p>
          <p className="text-ink-soft">
            {t("offline.keep_working", locale) || "You can keep working. "}{outboxCount > 0 ? (
              <span className="font-medium text-warning-deep">{outboxCount} {outboxCount === 1 ? (t("offline.draft_singular", locale) || 'draft is waiting to sync.') : (t("offline.draft_plural", locale) || 'drafts are waiting to sync.')}</span>
            ) : (
              t("offline.drafts_saved", locale) || "Drafts are saved securely on this device and submitted when you're back online."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
