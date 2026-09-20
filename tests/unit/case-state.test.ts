import { describe, expect, it } from "vitest";
import {
  canClose,
  canTransitionResponse,
  canTransitionVerification,
  isResolved,
  verificationAfterClosure
} from "@/lib/case-state";

describe("response transitions", () => {
  it("allows the ordinary progression", () => {
    expect(canTransitionResponse("received", "acknowledged").ok).toBe(true);
    expect(canTransitionResponse("acknowledged", "in_progress").ok).toBe(true);
    expect(canTransitionResponse("in_progress", "action_recorded").ok).toBe(true);
    expect(canTransitionResponse("action_recorded", "closed").ok).toBe(true);
  });

  it("refuses to skip from received straight to closed", () => {
    const result = canTransitionResponse("received", "closed");
    expect(result.ok).toBe(false);
  });

  it("refuses a no-op transition", () => {
    expect(canTransitionResponse("acknowledged", "acknowledged").ok).toBe(false);
  });

  it("only lets a closed case reopen into in_progress", () => {
    expect(canTransitionResponse("closed", "in_progress").ok).toBe(true);
    expect(canTransitionResponse("closed", "acknowledged").ok).toBe(false);
    expect(canTransitionResponse("closed", "action_recorded").ok).toBe(false);
  });
});

describe("verification transitions", () => {
  it("requires a stated reason", () => {
    expect(canTransitionVerification("unverified", "documented", undefined).ok).toBe(false);
    expect(canTransitionVerification("unverified", "documented", "too short").ok).toBe(false);
    expect(
      canTransitionVerification("unverified", "documented", "Utility notice documents the outage window.").ok
    ).toBe(true);
  });

  it("does not let anyone set resolved directly", () => {
    const result = canTransitionVerification("documented", "resolved", "A perfectly good reason here.");
    expect(result.ok).toBe(false);
  });

  it("does not let a resolved case be silently re-graded", () => {
    const result = canTransitionVerification("resolved", "unverified", "A perfectly good reason here.");
    expect(result.ok).toBe(false);
  });
});

describe("closure", () => {
  const documented = { hasRecordedAction: true, hasOutcomeUpdate: true };

  it("requires a recorded action", () => {
    const result = canClose("in_progress", { ...documented, hasRecordedAction: false });
    expect(result.ok).toBe(false);
  });

  it("requires a public outcome", () => {
    const result = canClose("in_progress", { ...documented, hasOutcomeUpdate: false });
    expect(result.ok).toBe(false);
  });

  it("allows closure once both exist", () => {
    expect(canClose("action_recorded", documented).ok).toBe(true);
  });

  // The product's central promise: RESPONDED is not VERIFIED.
  it("does not mark an unverified case resolved just because it was closed", () => {
    expect(verificationAfterClosure("unverified")).toBe("unverified");
  });

  it("does not paper over conflicting evidence on closure", () => {
    expect(verificationAfterClosure("conflicting")).toBe("conflicting");
  });

  it("does move an already-established case to resolved", () => {
    expect(verificationAfterClosure("documented")).toBe("resolved");
    expect(verificationAfterClosure("partially_verified")).toBe("resolved");
  });
});

describe("isResolved", () => {
  it("treats either axis reaching its end state as resolved for display", () => {
    expect(isResolved({ response: "closed", verification: "unverified" })).toBe(true);
    expect(isResolved({ response: "in_progress", verification: "resolved" })).toBe(true);
    expect(isResolved({ response: "in_progress", verification: "documented" })).toBe(false);
  });
});
