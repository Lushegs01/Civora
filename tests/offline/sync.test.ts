import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The sync engine talks to IndexedDB and the network. Both are stubbed here so
// the retry semantics can be asserted deterministically.

const store = new Map<string, unknown>();

vi.mock("@/lib/offline/db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/offline/db")>("@/lib/offline/db");
  return {
    ...actual,
    listOutbox: async () => Array.from(store.values()) as never,
    updateOutboxItem: async (id: string, patch: Record<string, unknown>) => {
      const existing = store.get(id) as Record<string, unknown> | undefined;
      if (existing) store.set(id, { ...existing, ...patch });
    },
    removeFromOutbox: async (id: string) => {
      store.delete(id);
    },
    saveToken: vi.fn(async () => undefined),
    getToken: async () => ({ caseId: "CS-1", token: "t".repeat(40), savedAt: "" })
  };
});

function queueItem(id: string, over: Record<string, unknown> = {}) {
  store.set(id, {
    id,
    queuedAt: new Date(0).toISOString(),
    payload: { category: "other", description: "x".repeat(30), privacyMode: "anonymous" },
    files: [],
    status: "queued",
    attempts: 0,
    ...over
  });
}

beforeEach(() => {
  store.clear();
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
  vi.stubGlobal("CustomEvent", class {
    constructor(public type: string, public init?: { detail?: unknown }) {}
  });
  vi.stubGlobal("BroadcastChannel", undefined);
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("flushOutbox", () => {
  it("submits a queued report and removes it from the queue", async () => {
    queueItem("a");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ caseId: "CS-1", token: "t".repeat(40) }), { status: 201 }))
    );

    const { flushOutbox } = await import("@/lib/offline/sync");
    const summary = await flushOutbox();

    expect(summary?.succeeded).toBe(1);
    expect(summary?.outcomes[0]).toMatchObject({ ok: true, caseId: "CS-1" });
    expect(store.size).toBe(0);
  });

  // The behaviour the old implementation lacked entirely.
  it("keeps going when one item fails permanently", async () => {
    queueItem("bad");
    queueItem("good");
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return body.marker === "bad"
        ? new Response(JSON.stringify({ error: "Description too short." }), { status: 400 })
        : new Response(JSON.stringify({ caseId: "CS-2", token: "t".repeat(40) }), { status: 201 });
    });
    store.set("bad", { ...(store.get("bad") as object), payload: { marker: "bad" } });
    store.set("good", { ...(store.get("good") as object), payload: { marker: "good" } });
    vi.stubGlobal("fetch", fetchMock);

    const { flushOutbox } = await import("@/lib/offline/sync");
    const summary = await flushOutbox();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(summary?.succeeded).toBe(1);
    expect(summary?.deadLettered).toBe(1);
    // The good one is gone; the bad one is retained for the person to fix.
    expect(Array.from(store.keys())).toEqual(["bad"]);
    expect((store.get("bad") as { status: string }).status).toBe("dead_letter");
  });

  it("schedules a retry for a transient server failure", async () => {
    queueItem("a");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));

    const { flushOutbox } = await import("@/lib/offline/sync");
    const summary = await flushOutbox();

    expect(summary?.failed).toBe(1);
    const entry = store.get("a") as { status: string; attempts: number; nextAttemptAt?: string };
    expect(entry.status).toBe("retrying");
    expect(entry.attempts).toBe(1);
    expect(Date.parse(entry.nextAttemptAt!)).toBeGreaterThan(Date.now());
  });

  it("does not re-file a case when only the attachments failed", async () => {
    queueItem("a", { files: [{ id: "f", fileName: "a.jpg", mimeType: "image/jpeg", blob: new Blob(["x"]) }] });
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes("/api/reports")
        ? new Response(JSON.stringify({ caseId: "CS-9", token: "t".repeat(40) }), { status: 201 })
        : new Response("{}", { status: 503 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { flushOutbox } = await import("@/lib/offline/sync");
    await flushOutbox();

    const entry = store.get("a") as { caseId?: string; status: string };
    expect(entry.caseId).toBe("CS-9");
    expect(entry.status).toBe("retrying");

    // A second flush must not create a second case.
    (store.get("a") as { nextAttemptAt?: string }).nextAttemptAt = new Date(0).toISOString();
    await flushOutbox();
    const reportCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/reports"));
    expect(reportCalls).toHaveLength(1);
  });

  it("does nothing while the device is offline", async () => {
    queueItem("a");
    vi.stubGlobal("navigator", { onLine: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { flushOutbox } = await import("@/lib/offline/sync");
    expect(await flushOutbox()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("announces each outcome so the report screen can update", async () => {
    queueItem("a");
    const dispatch = vi.fn();
    vi.stubGlobal("window", { dispatchEvent: dispatch, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ caseId: "CS-1", token: "t".repeat(40) }), { status: 201 }))
    );

    const { flushOutbox, SUBMITTED_EVENT } = await import("@/lib/offline/sync");
    await flushOutbox();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(SUBMITTED_EVENT);
    expect(dispatch.mock.calls[0][0].init.detail).toMatchObject({ ok: true, caseId: "CS-1" });
  });
});
