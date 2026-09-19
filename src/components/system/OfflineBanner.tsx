"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { listOutbox } from "@/lib/offline/db";

export function OfflineBanner() {
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
          <p className="font-semibold text-ink">No connection</p>
          <p className="text-ink-soft">
            You can keep working. {outboxCount > 0 ? (
              <span className="font-medium text-warning-deep">{outboxCount} {outboxCount === 1 ? 'draft is' : 'drafts are'} waiting to sync.</span>
            ) : (
              "Drafts are saved securely on this device and submitted when you're back online."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
