"use client";

// Client-side offline layer. Drafts and the submission outbox live in
// IndexedDB so a report survives reloads, offline periods and sync attempts.
// Tracking tokens for the user's own cases also live here (device-local).

import type { PrivacyMode } from "../types";

const DB_NAME = "civora";
const DB_VERSION = 1;
const DRAFT = "drafts";
const OUTBOX = "outbox";
const TOKENS = "tokens";

export interface ReportDraft {
  id: "current";
  savedAt: string;
  category?: string;
  description?: string;
  locationGeneral?: string;
  coordinates?: { lat: number; lng: number };
  incidentChoice?: "now" | "earlier" | "custom";
  incidentAt?: string;
  privacyMode?: PrivacyMode;
  contactName?: string;
  evidenceMeta?: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number; dataBase64: string }>;
  step?: number;
}

export interface OutboxItem {
  id: string;
  queuedAt: string;
  payload: unknown; // validated report submission
  attempts: number;
  lastError?: string;
}

export interface TokenEntry {
  caseId: string;
  token: string;
  savedAt: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFT)) db.createObjectStore(DRAFT, { keyPath: "id" });
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "id" });
      if (!db.objectStoreNames.contains(TOKENS)) db.createObjectStore(TOKENS, { keyPath: "caseId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

// ---- drafts ----------------------------------------------------------------

export async function saveDraft(draft: Omit<ReportDraft, "id" | "savedAt">): Promise<void> {
  const d: ReportDraft = { ...draft, id: "current", savedAt: new Date().toISOString() };
  await tx(DRAFT, "readwrite", (s) => s.put(d) as unknown as IDBRequest<IDBValidKey>);
}

export async function loadDraft(): Promise<ReportDraft | undefined> {
  return tx<ReportDraft | undefined>(DRAFT, "readonly", (s) => s.get("current"));
}

export async function clearDraft(): Promise<void> {
  await tx(DRAFT, "readwrite", (s) => s.delete("current"));
}

// ---- outbox ----------------------------------------------------------------

export async function queueSubmission(payload: unknown): Promise<OutboxItem> {
  const item: OutboxItem = { id: crypto.randomUUID(), queuedAt: new Date().toISOString(), payload, attempts: 0 };
  await tx(OUTBOX, "readwrite", (s) => s.put(item) as unknown as IDBRequest<IDBValidKey>);
  return item;
}

export async function listOutbox(): Promise<OutboxItem[]> {
  return tx<OutboxItem[]>(OUTBOX, "readonly", (s) => s.getAll() as IDBRequest<OutboxItem[]>);
}

export async function removeFromOutbox(id: string): Promise<void> {
  await tx(OUTBOX, "readwrite", (s) => s.delete(id));
}

// ---- tracking tokens -------------------------------------------------------

export async function saveToken(caseId: string, token: string): Promise<void> {
  await tx(TOKENS, "readwrite", (s) => s.put({ caseId, token, savedAt: new Date().toISOString() }) as unknown as IDBRequest<IDBValidKey>);
}

export async function getTokens(): Promise<TokenEntry[]> {
  return tx<TokenEntry[]>(TOKENS, "readonly", (s) => s.getAll() as IDBRequest<TokenEntry[]>);
}

export async function getToken(caseId: string): Promise<TokenEntry | undefined> {
  return tx<TokenEntry | undefined>(TOKENS, "readonly", (s) => s.get(caseId));
}

// ---- demo tracking seed ----------------------------------------------------
// First visit on a demo device adopts the primary demo cases as "your cases"
// so the home dashboard shows a realistic starting point. Real submissions
// replace/augment this list naturally.

const DEMO_SEED_KEY = "civora_demo_tracking_seeded_v1";

export const DEMO_TRACKING: Array<{ caseId: string; token: string }> = [
  { caseId: "CS-1042", token: "demo-device-token-cs1042-0000000000aaaa" },
  { caseId: "CS-1040", token: "demo-device-token-cs1040-0000000000bbbb" }
];

export function maybeSeedDemoTracking(): void {
  try {
    if (localStorage.getItem(DEMO_SEED_KEY)) return;
    localStorage.setItem(DEMO_SEED_KEY, "1");
    DEMO_TRACKING.forEach(async ({ caseId, token }) => {
      if (!(await getToken(caseId))) await saveToken(caseId, token);
    });
  } catch {
    // private browsing etc. — tracking simply won't persist
  }
}
