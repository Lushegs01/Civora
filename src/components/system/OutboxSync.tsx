"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listOutbox, removeFromOutbox, saveToken } from "@/lib/offline/db";
import { Icon } from "@/components/ui/Icon";

// Watches the submission outbox. When the device comes back online, queued
// reports are submitted automatically and the result is surfaced once.

interface SyncNotice {
  kind: "success" | "error";
  caseId?: string;
  message: string;
}

export function OutboxSync() {
  const [notice, setNotice] = useState<SyncNotice | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncing = useRef(false);

  const flush = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return;
    try {
      const items = await listOutbox();
      if (items.length === 0) return;
      
      syncing.current = true;
      setIsSyncing(true);
      
      let successCount = 0;
      let lastCaseId = undefined;
      let linked = false;

      for (const item of items) {
        try {
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Submission failed");
          if (data.caseId && data.token) await saveToken(data.caseId, data.token);
          await removeFromOutbox(item.id);
          
          successCount++;
          lastCaseId = data.linkedTo || data.caseId;
          if (data.linkedTo) linked = true;
        } catch (e) {
          break;
        }
      }

      if (successCount > 0) {
        setNotice({
          kind: "success",
          caseId: successCount === 1 ? lastCaseId : undefined,
          message: successCount === 1 
            ? (linked ? "Your saved report was submitted after reconnecting and linked to an existing case." : "Your saved report was submitted automatically after reconnecting.")
            : `${successCount} saved reports were submitted automatically.`
        });
      }
    } finally {
      syncing.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    flush();
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 10_000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice && !isSyncing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm animate-in md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <div className="card flex items-start gap-3 p-4 shadow-raise">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isSyncing 
              ? "bg-brand-soft text-brand-deep"
              : notice?.kind === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
          }`}
        >
          {isSyncing ? (
            <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
          ) : (
            <Icon name={notice?.kind === "success" ? "check-circle-2" : "circle-alert"} className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-ink">
            {isSyncing ? "Syncing drafts..." : notice?.kind === "success" ? "Report submitted" : "Submission problem"}
          </p>
          <p className="mt-0.5 leading-relaxed text-ink-soft">
            {isSyncing ? "Please wait while your offline reports are submitted." : notice?.message}
            {notice?.caseId && !isSyncing && (
              <>
                {" "}
                Case{" "}
                <a className="font-medium text-brand-deep underline underline-offset-2" href={`/cases/${notice.caseId}`}>
                  #{notice.caseId}
                </a>
                .
              </>
            )}
          </p>
        </div>
        {!isSyncing && (
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="rounded-full p-1.5 text-ink-soft hover:bg-muted hover:text-ink"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
