import type { ResponseState, VerificationState } from "@prisma/client";

// Verification and response are independent axes and stay that way. Closing a
// case says a response happened; it does not say the underlying claim was
// established. Every transition below is enforced server-side in
// src/app/api/responder/actions/route.ts — the UI only mirrors it.

export type TransitionResult = { ok: true } | { ok: false; reason: string };

const RESPONSE_TRANSITIONS: Record<ResponseState, ResponseState[]> = {
  not_assigned: ["received", "acknowledged"],
  received: ["acknowledged", "in_progress"],
  acknowledged: ["in_progress", "action_recorded", "closed"],
  in_progress: ["action_recorded", "acknowledged", "closed"],
  action_recorded: ["in_progress", "closed"],
  // Reopening is deliberate and explicit, never a side effect of another action.
  closed: ["in_progress"]
};

export function canTransitionResponse(from: ResponseState, to: ResponseState): TransitionResult {
  if (from === to) return { ok: false, reason: `This case is already ${RESPONSE_LABEL[to]}.` };
  if (RESPONSE_TRANSITIONS[from].includes(to)) return { ok: true };
  return {
    ok: false,
    reason: `A case that is ${RESPONSE_LABEL[from]} cannot move straight to ${RESPONSE_LABEL[to]}.`
  };
}

const RESPONSE_LABEL: Record<ResponseState, string> = {
  not_assigned: "not assigned",
  received: "received",
  acknowledged: "acknowledged",
  in_progress: "in progress",
  action_recorded: "at action recorded",
  closed: "closed"
};

const VERIFICATION_LABEL: Record<VerificationState, string> = {
  unverified: "Unverified",
  partially_verified: "Partially verified",
  documented: "Documented",
  conflicting: "Conflicting",
  resolved: "Resolved"
};

/**
 * Verification changes always need a stated reason, and `resolved` is not a
 * state a responder can pick: it is only reached when a closure documents an
 * outcome *and* the evidence actually supports it.
 */
export function canTransitionVerification(
  from: VerificationState,
  to: VerificationState,
  reason: string | undefined
): TransitionResult {
  if (from === to) return { ok: false, reason: `Verification is already ${VERIFICATION_LABEL[to]}.` };
  if (!reason || reason.trim().length < 10) {
    return { ok: false, reason: "Record why the verification state is changing (at least 10 characters)." };
  }
  if (to === "resolved") {
    return {
      ok: false,
      reason: "Resolved is recorded when a case is closed with a documented outcome, not set directly."
    };
  }
  if (from === "resolved") {
    return {
      ok: false,
      reason: "Reopen the case before changing the verification state of a resolved case."
    };
  }
  return { ok: true };
}

export interface ClosureRequirements {
  /** Documented action recorded on the case. */
  hasRecordedAction: boolean;
  /** A public update describing the outcome. */
  hasOutcomeUpdate: boolean;
}

/**
 * A case may only be closed once there is something to point at: an action on
 * the record and an outcome the public can read.
 */
export function canClose(
  from: ResponseState,
  requirements: ClosureRequirements
): TransitionResult {
  const transition = canTransitionResponse(from, "closed");
  if (!transition.ok) return transition;
  if (!requirements.hasRecordedAction) {
    return { ok: false, reason: "Record the action taken before closing this case." };
  }
  if (!requirements.hasOutcomeUpdate) {
    return { ok: false, reason: "A public update documenting the outcome is required to close a case." };
  }
  return { ok: true };
}

/**
 * Verification state after a closure.
 *
 * Closing documents a *response*. It is only allowed to move verification to
 * `resolved` when the claim itself was already established; a case closed
 * while still unverified or conflicting keeps that state, because pretending
 * otherwise is exactly the collapse Civora exists to prevent.
 */
export function verificationAfterClosure(current: VerificationState): VerificationState {
  return current === "documented" || current === "partially_verified" ? "resolved" : current;
}

export function isResolved(caseRecord: { response: ResponseState; verification: VerificationState }): boolean {
  return caseRecord.response === "closed" || caseRecord.verification === "resolved";
}

export { RESPONSE_LABEL, VERIFICATION_LABEL };
