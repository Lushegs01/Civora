import { beforeEach, describe, expect, it, vi } from "vitest";
import { backoffDelayMs, isDue, MAX_ATTEMPTS, type OutboxItem } from "@/lib/offline/db";

// The outbox is the promise that a report written with no signal still reaches
// the response desk. These tests pin the two behaviours the previous version
// got wrong: one bad item blocking the queue, and retries with no backoff.

function item(over: Partial<OutboxItem> = {}): OutboxItem {
  return {
    id: "item-1",
    queuedAt: new Date().toISOString(),
    payload: {},
    files: [],
    status: "queued",
    attempts: 0,
    ...over
  };
}

describe("backoff", () => {
  it("grows with each attempt", () => {
    const first = Array.from({ length: 50 }, () => backoffDelayMs(1));
    const fourth = Array.from({ length: 50 }, () => backoffDelayMs(4));
    expect(Math.min(...fourth)).toBeGreaterThan(Math.max(...first));
  });

  it("is jittered, so a neighbourhood reconnecting does not arrive as one burst", () => {
    const delays = new Set(Array.from({ length: 200 }, () => backoffDelayMs(3)));
    expect(delays.size).toBeGreaterThan(50);
  });

  it("is capped, so an item never waits indefinitely", () => {
    expect(backoffDelayMs(50)).toBeLessThanOrEqual(30 * 60_000);
  });

  it("never returns a non-positive delay", () => {
    for (let attempt = 0; attempt <= MAX_ATTEMPTS; attempt += 1) {
      expect(backoffDelayMs(attempt)).toBeGreaterThan(0);
    }
  });
});

describe("due-for-retry rules", () => {
  const now = Date.parse("2026-03-01T12:00:00Z");

  it("runs a freshly queued item immediately", () => {
    expect(isDue(item(), now)).toBe(true);
  });

  it("waits until the scheduled retry time", () => {
    const waiting = item({
      status: "retrying",
      attempts: 2,
      nextAttemptAt: new Date(now + 60_000).toISOString()
    });
    expect(isDue(waiting, now)).toBe(false);
    expect(isDue(waiting, now + 61_000)).toBe(true);
  });

  it("never retries a succeeded item", () => {
    expect(isDue(item({ status: "succeeded" }), now)).toBe(false);
  });

  it("never retries a dead-lettered item automatically", () => {
    expect(isDue(item({ status: "dead_letter", attempts: MAX_ATTEMPTS }), now)).toBe(false);
  });

  it("recovers an item left mid-sync by a tab that was closed", () => {
    const stuck = item({
      status: "syncing",
      lastAttemptAt: new Date(now - 5 * 60_000).toISOString()
    });
    expect(isDue(stuck, now)).toBe(true);
  });

  it("does not steal an item another tab is actively syncing", () => {
    const active = item({ status: "syncing", lastAttemptAt: new Date(now - 5_000).toISOString() });
    expect(isDue(active, now)).toBe(false);
  });

  // The regression the previous implementation had: a `break` on first failure
  // meant one bad report blocked every other queued report indefinitely.
  it("treats each item independently", () => {
    const failing = item({
      id: "bad",
      status: "dead_letter",
      attempts: MAX_ATTEMPTS,
      lastError: "Description too short."
    });
    const healthy = item({ id: "good" });
    const queue = [failing, healthy];
    const due = queue.filter((entry) => isDue(entry, now));
    expect(due.map((entry) => entry.id)).toEqual(["good"]);
  });
});
