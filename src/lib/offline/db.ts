"use client";

// Device-local storage: drafts, the submission outbox, and tracking tokens.
//
// Every operation is resilient by design. IndexedDB is unavailable in some
// private-browsing modes, can be disabled by policy, can exceed quota, and can
// be corrupt after a crash. A reporter must never lose a draft because of any
// of that, so each store falls back to an in-memory mirror and the UI is told
// when persistence is degraded.

export type PersistenceMode = "indexeddb" | "memory";

const DB_NAME = "civora";
const DB_VERSION = 2;
const DRAFT = "drafts";
const OUTBOX = "outbox";
const TOKENS = "tokens";

export type OutboxStatus = "queued" | "syncing" | "succeeded" | "retrying" | "failed" | "dead_letter";

export interface ReportDraft {
  id: "current";
  savedAt: string;
  category?: string;
  description?: string;
  locationGeneral?: string;
  coordinates?: { lat: number; lng: number };
  incidentChoice?: "now" | "earlier" | "custom";
  incidentAt?: string;
  privacyMode?: string;
  contact?: { name?: string; email?: string; phone?: string; preferredChannel?: string };
  /** Files are kept as Blobs, not base64 — a third smaller and far cheaper to store. */
  evidence?: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number; blob: Blob }>;
  step?: number;
}

export interface OutboxItem {
  id: string;
  queuedAt: string;
  /** Validated report submission payload (JSON metadata only). */
  payload: unknown;
  files: Array<{ id: string; fileName: string; mimeType: string; blob: Blob }>;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  lastError?: string;
  /** Set once the report has been accepted, so a retry can't double-submit. */
  caseId?: string;
}

export interface TokenEntry {
  caseId: string;
  token: string;
  savedAt: string;
}

/** Number of failed attempts after which an item stops retrying by itself. */
export const MAX_ATTEMPTS = 6;

let mode: PersistenceMode = "indexeddb";
let openPromise: Promise<IDBDatabase | null> | null = null;

/** In-memory mirror used whenever IndexedDB is unavailable. */
const memory = {
  drafts: new Map<string, ReportDraft>(),
  outbox: new Map<string, OutboxItem>(),
  tokens: new Map<string, TokenEntry>()
};

export function persistenceMode(): PersistenceMode {
  return mode;
}

function openDb(): Promise<IDBDatabase | null> {
  if (openPromise) return openPromise;
  openPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      mode = "memory";
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      if (!db) mode = "memory";
      resolve(db);
    };
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DRAFT)) db.createObjectStore(DRAFT, { keyPath: "id" });
        if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "id" });
        if (!db.objectStoreNames.contains(TOKENS)) db.createObjectStore(TOKENS, { keyPath: "caseId" });
      };
      request.onsuccess = () => {
        const db = request.result;
        // A later version bump or a corrupt store surfaces here; degrade
        // instead of throwing inside an unrelated call.
        db.onversionchange = () => db.close();
        finish(db);
      };
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
      // Some private-browsing modes never resolve either callback.
      setTimeout(() => finish(null), 3000);
    } catch {
      finish(null);
    }
  });
  return openPromise;
}

async function run<T>(
  store: string,
  txMode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest,
  fallback: () => T
): Promise<T> {
  const db = await openDb();
  if (!db) return fallback();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, txMode);
      const request = action(tx.objectStore(store));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (error) {
    // Quota exceeded, corrupt store, or a closed connection: fall back to
    // memory for the rest of the session rather than losing the write.
    mode = "memory";
    if (typeof console !== "undefined") {
      console.warn("Civora: device storage unavailable, keeping this session in memory.", error);
    }
    return fallback();
  }
}

// ---- drafts ----------------------------------------------------------------

export async function saveDraft(draft: Omit<ReportDraft, "id" | "savedAt">): Promise<void> {
  const record: ReportDraft = { ...draft, id: "current", savedAt: new Date().toISOString() };
  memory.drafts.set("current", record);
  await run(DRAFT, "readwrite", (s) => s.put(record), () => undefined);
}

export async function loadDraft(): Promise<ReportDraft | undefined> {
  const stored = await run<ReportDraft | undefined>(
    DRAFT,
    "readonly",
    (s) => s.get("current"),
    () => memory.drafts.get("current")
  );
  return stored ?? memory.drafts.get("current");
}

export async function clearDraft(): Promise<void> {
  memory.drafts.delete("current");
  await run(DRAFT, "readwrite", (s) => s.delete("current"), () => undefined);
}

// ---- outbox ----------------------------------------------------------------

export async function queueSubmission(
  payload: unknown,
  files: OutboxItem["files"] = []
): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: newId(),
    queuedAt: new Date().toISOString(),
    payload,
    files,
    status: "queued",
    attempts: 0,
    nextAttemptAt: new Date().toISOString()
  };
  memory.outbox.set(item.id, item);
  await run(OUTBOX, "readwrite", (s) => s.put(item), () => undefined);
  return item;
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const stored = await run<OutboxItem[]>(
    OUTBOX,
    "readonly",
    (s) => s.getAll(),
    () => Array.from(memory.outbox.values())
  );
  const items = stored ?? [];
  return items.length > 0 ? items : Array.from(memory.outbox.values());
}

export async function updateOutboxItem(id: string, patch: Partial<OutboxItem>): Promise<void> {
  const existing = (await listOutbox()).find((i) => i.id === id);
  if (!existing) return;
  const next = { ...existing, ...patch };
  memory.outbox.set(id, next);
  await run(OUTBOX, "readwrite", (s) => s.put(next), () => undefined);
}

export async function removeFromOutbox(id: string): Promise<void> {
  memory.outbox.delete(id);
  await run(OUTBOX, "readwrite", (s) => s.delete(id), () => undefined);
}

/**
 * Exponential backoff with full jitter.
 *
 * Jitter matters here: when a whole neighbourhood comes back online at once,
 * unjittered retries would arrive as a thundering herd against a service that
 * may still be recovering.
 */
export function backoffDelayMs(attempts: number): number {
  const base = Math.min(30 * 60_000, 5_000 * 2 ** Math.max(0, attempts - 1));
  return Math.round(base / 2 + Math.random() * (base / 2));
}

export function isDue(item: OutboxItem, now = Date.now()): boolean {
  if (item.status === "succeeded" || item.status === "dead_letter") return false;
  if (item.status === "syncing") {
    // A tab that died mid-sync would otherwise pin the item forever.
    const started = item.lastAttemptAt ? Date.parse(item.lastAttemptAt) : 0;
    return now - started > 2 * 60_000;
  }
  if (!item.nextAttemptAt) return true;
  return Date.parse(item.nextAttemptAt) <= now;
}

// ---- tracking tokens -------------------------------------------------------

export async function saveToken(caseId: string, token: string): Promise<void> {
  const entry: TokenEntry = { caseId, token, savedAt: new Date().toISOString() };
  memory.tokens.set(caseId, entry);
  await run(TOKENS, "readwrite", (s) => s.put(entry), () => undefined);
}

export async function getTokens(): Promise<TokenEntry[]> {
  const stored = await run<TokenEntry[]>(
    TOKENS,
    "readonly",
    (s) => s.getAll(),
    () => Array.from(memory.tokens.values())
  );
  const entries = stored ?? [];
  return entries.length > 0 ? entries : Array.from(memory.tokens.values());
}

export async function getToken(caseId: string): Promise<TokenEntry | undefined> {
  const stored = await run<TokenEntry | undefined>(
    TOKENS,
    "readonly",
    (s) => s.get(caseId),
    () => memory.tokens.get(caseId)
  );
  return stored ?? memory.tokens.get(caseId);
}

export async function removeToken(caseId: string): Promise<void> {
  memory.tokens.delete(caseId);
  await run(TOKENS, "readwrite", (s) => s.delete(caseId), () => undefined);
}

export async function clearDeviceData(): Promise<void> {
  memory.drafts.clear();
  memory.outbox.clear();
  memory.tokens.clear();
  const db = await openDb();
  if (db) {
    db.close();
    openPromise = null;
    await new Promise<void>((resolve) => {
      try {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
