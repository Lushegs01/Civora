"use client";

import {
  backoffDelayMs,
  isDue,
  listOutbox,
  MAX_ATTEMPTS,
  removeFromOutbox,
  saveToken,
  updateOutboxItem,
  type OutboxItem
} from "./db";

// The outbox sync engine.
//
// Each queued report is retried independently: one permanently failing item
// can never block the rest of the queue, which is what happened before when a
// single failure broke out of the loop.
//
// Tabs coordinate over a Web Lock (falling back to a timestamp in
// localStorage), so two open tabs cannot submit the same report twice, and the
// result of a sync is broadcast to every tab through BroadcastChannel so the
// report wizard shows the outcome wherever the person happens to be looking.

export const SUBMITTED_EVENT = "civora:submitted";
const CHANNEL = "civora-sync";
const LOCK_KEY = "civora-sync-lock";
const LOCK_TTL_MS = 60_000;

export interface SyncOutcome {
  itemId: string;
  ok: boolean;
  caseId?: string;
  possibleMatches?: Array<{ caseId: string; score: number }>;
  error?: string;
  permanent?: boolean;
}

export interface SyncSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  outcomes: SyncOutcome[];
}

let channel: BroadcastChannel | null = null;

function broadcast(outcome: SyncOutcome) {
  const detail = { ...outcome };
  // Same tab.
  window.dispatchEvent(new CustomEvent(SUBMITTED_EVENT, { detail }));
  // Other tabs.
  try {
    channel ??= typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;
    channel?.postMessage({ type: SUBMITTED_EVENT, detail });
  } catch {
    // BroadcastChannel is unavailable; the originating tab still gets the event.
  }
}

/** Re-emits other tabs' outcomes locally, so every tab sees one consistent story. */
export function listenForCrossTabOutcomes(): () => void {
  try {
    if (typeof BroadcastChannel === "undefined") return () => undefined;
    const c = new BroadcastChannel(CHANNEL);
    const handler = (event: MessageEvent) => {
      if (event.data?.type === SUBMITTED_EVENT) {
        window.dispatchEvent(new CustomEvent(SUBMITTED_EVENT, { detail: event.data.detail }));
      }
    };
    c.addEventListener("message", handler);
    return () => {
      c.removeEventListener("message", handler);
      c.close();
    };
  } catch {
    return () => undefined;
  }
}

/** Runs `fn` while holding the cross-tab sync lock, or skips it if another tab holds it. */
async function withLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (locks?.request) {
    return locks.request(LOCK_KEY, { ifAvailable: true }, async (lock) => (lock ? fn() : null));
  }
  // Fallback: a timestamp guard. Not airtight, but it stops the common case of
  // two tabs flushing at the same moment, and the server is idempotent-ish
  // because each item is removed as soon as it succeeds.
  try {
    const held = Number.parseInt(localStorage.getItem(LOCK_KEY) || "0", 10);
    if (Number.isFinite(held) && Date.now() - held < LOCK_TTL_MS) return null;
    localStorage.setItem(LOCK_KEY, String(Date.now()));
    try {
      return await fn();
    } finally {
      localStorage.removeItem(LOCK_KEY);
    }
  } catch {
    return fn();
  }
}

/**
 * Flushes every due item in the outbox.
 *
 * Returns a summary rather than throwing: a failed item is data, not an
 * exception, and the caller decides what to tell the person.
 */
export async function flushOutbox(): Promise<SyncSummary | null> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;

  return withLock(async () => {
    const items = (await listOutbox()).filter((item) => isDue(item));
    const summary: SyncSummary = { attempted: 0, succeeded: 0, failed: 0, deadLettered: 0, outcomes: [] };

    for (const item of items) {
      summary.attempted += 1;
      const outcome = await syncItem(item);
      summary.outcomes.push(outcome);
      if (outcome.ok) summary.succeeded += 1;
      else if (outcome.permanent) summary.deadLettered += 1;
      else summary.failed += 1;
      broadcast(outcome);
      // Deliberately continue: the next item gets its own attempt regardless.
    }
    return summary;
  });
}

async function syncItem(item: OutboxItem): Promise<SyncOutcome> {
  const attempts = item.attempts + 1;
  await updateOutboxItem(item.id, {
    status: "syncing",
    attempts,
    lastAttemptAt: new Date().toISOString()
  });

  try {
    // An item that already has a caseId got as far as creating the case on a
    // previous attempt; resume at the upload step instead of filing it twice.
    let caseId = item.caseId;
    let token: string | undefined;
    let possibleMatches: Array<{ caseId: string; score: number }> | undefined;

    if (!caseId) {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return failure(item, attempts, data?.error || "Submission failed.", isPermanent(res.status));
      }
      caseId = data.caseId as string;
      token = data.token as string | undefined;
      possibleMatches = data.possibleMatches;
      if (caseId && token) await saveToken(caseId, token);
      await updateOutboxItem(item.id, { caseId });
    }

    // Files are uploaded one at a time; a failure here does not lose the case.
    for (const file of item.files) {
      const storedToken = token ?? (await tokenFor(caseId!));
      if (!storedToken) break;
      const form = new FormData();
      form.append("caseId", caseId!);
      form.append("token", storedToken);
      form.append("file", file.blob, file.fileName);
      const res = await fetch("/api/evidence", { method: "POST", body: form });
      if (!res.ok && res.status >= 500) {
        // Keep the item queued so the remaining files retry later.
        return failure(item, attempts, "Some attachments are still waiting to upload.", false, caseId);
      }
    }

    await removeFromOutbox(item.id);
    return { itemId: item.id, ok: true, caseId, possibleMatches };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error.";
    return failure(item, attempts, message, false);
  }
}

async function tokenFor(caseId: string): Promise<string | undefined> {
  const { getToken } = await import("./db");
  return (await getToken(caseId))?.token;
}

/** 4xx other than 408/429 will not succeed on a retry. */
function isPermanent(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

async function failure(
  item: OutboxItem,
  attempts: number,
  message: string,
  permanent: boolean,
  caseId?: string
): Promise<SyncOutcome> {
  const exhausted = permanent || attempts >= MAX_ATTEMPTS;
  await updateOutboxItem(item.id, {
    status: exhausted ? "dead_letter" : "retrying",
    lastError: message,
    attempts,
    caseId: caseId ?? item.caseId,
    nextAttemptAt: exhausted ? undefined : new Date(Date.now() + backoffDelayMs(attempts)).toISOString()
  });
  return { itemId: item.id, ok: false, error: message, permanent: exhausted, caseId: caseId ?? item.caseId };
}
