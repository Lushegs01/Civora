"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listOutbox, persistenceMode, type OutboxItem } from "@/lib/offline/db";
import { flushOutbox, listenForCrossTabOutcomes, SUBMITTED_EVENT } from "@/lib/offline/sync";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

interface Notice {
  kind: "success" | "error" | "warning";
  caseId?: string;
  message: string;
}

/** How often a queued item is re-checked while the tab stays open. */
const POLL_INTERVAL_MS = 60_000;

/**
 * Background sync for queued reports.
 *
 * Each item retries on its own schedule, so one permanently failing report
 * never holds up the others, and the outcome of every attempt is announced —
 * including the failures, which the previous version swallowed silently.
 */
export function OutboxSync() {
  const { locale } = useLocale();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const running = useRef(false);

  const refreshPending = useCallback(async () => {
    const items = await listOutbox();
    setPending(items.filter((i: OutboxItem) => i.status !== "succeeded").length);
  }, []);

  const flush = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setIsSyncing(true);
    try {
      const summary = await flushOutbox();
      if (!summary || summary.attempted === 0) return;

      if (summary.succeeded > 0) {
        const single = summary.outcomes.find((o) => o.ok);
        setNotice({
          kind: "success",
          caseId: summary.succeeded === 1 ? single?.caseId : undefined,
          message:
            summary.succeeded === 1
              ? t("outbox.success.single", locale) ||
                "Your saved report was submitted automatically after reconnecting."
              : (t("outbox.success.multiple", locale) || "{count} saved reports were submitted automatically.").replace(
                  "{count}",
                  String(summary.succeeded)
                )
        });
      } else if (summary.deadLettered > 0) {
        setNotice({
          kind: "error",
          message:
            t("outbox.failed.permanent", locale) ||
            "A saved report couldn't be submitted. Open it from the report screen to try again or correct it."
        });
      } else if (summary.failed > 0) {
        setNotice({
          kind: "warning",
          message:
            t("outbox.failed.retrying", locale) ||
            "A saved report hasn't gone through yet. Civora will keep trying in the background."
        });
      }
    } finally {
      running.current = false;
      setIsSyncing(false);
      void refreshPending();
    }
  }, [locale, refreshPending]);

  useEffect(() => {
    void refreshPending();
    void flush();

    const onOnline = () => void flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    // A retry can become due while the tab sits idle and online.
    const timer = setInterval(() => void flush(), POLL_INTERVAL_MS);

    // Outcomes from other tabs are mirrored here so the story stays consistent.
    const stopListening = listenForCrossTabOutcomes();
    const onSubmitted = () => void refreshPending();
    window.addEventListener(SUBMITTED_EVENT, onSubmitted);

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(SUBMITTED_EVENT, onSubmitted);
      clearInterval(timer);
      stopListening();
    };
  }, [flush, refreshPending]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 12_000);
    return () => clearTimeout(timer);
  }, [notice]);

  const degraded = persistenceMode() === "memory" && pending > 0;

  if (!notice && !isSyncing && !degraded) return null;

  const tone = isSyncing
    ? "bg-brand-soft text-brand-deep"
    : notice?.kind === "success"
      ? "bg-success-soft text-success"
      : notice?.kind === "warning"
        ? "bg-warning-soft text-warning"
        : "bg-danger-soft text-danger";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm animate-in md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <div className="card flex items-start gap-3 p-4 shadow-raise">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
          {isSyncing ? (
            <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
          ) : (
            <Icon
              name={notice?.kind === "success" ? "check-circle-2" : "circle-alert"}
              className="h-4 w-4"
            />
          )}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-ink">
            {isSyncing
              ? t("outbox.syncing", locale) || "Syncing saved reports…"
              : notice?.kind === "success"
                ? t("outbox.submitted", locale) || "Report submitted"
                : t("outbox.problem", locale) || "Submission problem"}
          </p>
          <p className="mt-0.5 leading-relaxed text-ink-soft">
            {isSyncing
              ? t("outbox.wait", locale) || "Please wait while your offline reports are submitted."
              : notice?.message}
            {notice?.caseId && !isSyncing && (
              <>
                {" "}
                {t("outbox.case", locale) || "Case"}{" "}
                <a
                  className="font-medium text-brand-deep underline underline-offset-2"
                  href={`/cases/${notice.caseId}`}
                >
                  {notice.caseId}
                </a>
                .
              </>
            )}
          </p>
          {degraded && !isSyncing && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-warning">
              {t("outbox.memory_only", locale) ||
                "This browser isn't allowing Civora to save data on the device, so queued reports will be lost if you close this tab."}
            </p>
          )}
        </div>
        {!isSyncing && notice && (
          <button
            onClick={() => setNotice(null)}
            aria-label={t("outbox.dismiss", locale) || "Dismiss notification"}
            className="rounded-full p-1.5 text-ink-soft hover:bg-muted hover:text-ink"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
